import logging
import asyncio
from canvasapi.section import Section
from canvasapi.enrollment import Enrollment
from canvasapi import Canvas
from canvasapi.exceptions import CanvasException
from backend.ccm.canvas_api.canvasapi_serializer import CanvasObjectROSerializer
from asgiref.sync import async_to_sync
from dataclasses import dataclass
from .exceptions import HTTPAPIError

from django.conf import settings
from .constants import ROLE_TO_ENROLLMENT_TYPE

logger = logging.getLogger(__name__)

@dataclass
class EnrollmentUser:
    loginId: str
    role: str
    sectionId: int
class EnrollUsers:
    def __init__(self, canvas_api: Canvas, enrollment_params: dict, concurrency):
        self.canvas_api = canvas_api
        self.enrollment_params = enrollment_params
        self.concurrency = concurrency 

    @async_to_sync()
    async def gather_enrollments(self, enrollment_users, canvas_api):
        max_concurrent = int(self.concurrency + 2)
        semaphore = asyncio.Semaphore(max_concurrent)
        tasks = [self.enroll_user_concurrent_action(semaphore, canvas_api, user) for user in enrollment_users]
        return await asyncio.gather(*tasks, return_exceptions=True)

    async def enroll_user_concurrent_action(self, semaphore, canvas_api, enrollment_user: EnrollmentUser):
        section_id = enrollment_user['sectionId']
        login_id = enrollment_user['loginId'].lower()
        role = enrollment_user['role'].lower()
        try:
            async with semaphore:
                return await asyncio.to_thread(self.enroll_user, canvas_api, section_id, login_id, role)
        except Exception as e:
            logger.error(f"Error enrolling user {login_id}: {e}")
            return HTTPAPIError(str(enrollment_user), e)
    
    def process_login_id(self, login_id: str) -> str:
        """
        Process the login ID to strip the domain and handle special cases. Handles both UMich and Non-UMich email doimains along
        with simple login IDs.
        """
        if '@' in login_id:
            username, domain = login_id.split('@', 1) # Split only on the first '@'
            # Check if the domain ends exactly with '.umich.edu' or is 'umich.edu' (case-insensitive)
            if domain.lower() == 'umich.edu' or domain.lower().endswith('.umich.edu'):
                return username
            else:
                return f"{username}+{domain}" # Use f-string for concatenation
        else:
            return login_id

    def enroll_user(self, canvasapi: Canvas, section_id: int, login_id: str, role: str):
        """
        Enroll a user in a specific section using Canvas API.

        :param canvasapi: Instance of Canvas API client.
        :param section_id: ID of the section to enroll the user in.
        :param login_id: Login ID of the user to enroll.
        :param role: Role of the user to enroll (e.g., "student", "teacher").
        :return: Response from the Canvas API.
        """
        try:
            section = Section(canvasapi._Canvas__requester, {'id': section_id})
            enrollment_params = {
                "enrollment[user_id]": f"sis_login_id:{self.process_login_id(login_id)}",
                "enrollment[enrollment_state]": "active",
                "notify": False
            }
            if role in ROLE_TO_ENROLLMENT_TYPE:
                enrollment_params["enrollment[type]"] = ROLE_TO_ENROLLMENT_TYPE[role]
            elif role in settings.CUSTOM_CANVAS_ROLES:
                enrollment_params["enrollment[role_id]"] = settings.CUSTOM_CANVAS_ROLES[role]
            
            response = section._requester.request(
                "POST",
                f"sections/{section_id}/enrollments",
                _kwargs=list(enrollment_params.items())
            )
            allowed_fields = ['id', 'course_id', 'course_section_id', 'user_id', 'type']
            enrollment_result = Enrollment(section._requester, response.json())
            serializer = CanvasObjectROSerializer(enrollment_result, allowed_fields=allowed_fields)
            return serializer.data
        except (CanvasException, Exception) as e:
            raise

def enroll_user(canvasapi: Canvas, section_id: int, login_id: str, role: str):
        """
        Enroll a user in a specific section using Canvas API.

        :param canvasapi: Instance of Canvas API client.
        :param section_id: ID of the section to enroll the user in.
        :param login_id: Login ID of the user to enroll.
        :param role: Role of the user to enroll (e.g., "student", "teacher").
        :return: Response from the Canvas API.
        """
        try:
            section = Section(canvasapi._Canvas__requester, {'id': section_id})
            enrollment_params = {
                "enrollment[user_id]": f"sis_login_id:{(login_id)}",
                "enrollment[enrollment_state]": "active",
                "notify": False
            }
            if role in ROLE_TO_ENROLLMENT_TYPE:
                enrollment_params["enrollment[type]"] = ROLE_TO_ENROLLMENT_TYPE[role]
            elif role in settings.CUSTOM_CANVAS_ROLES:
                enrollment_params["enrollment[role_id]"] = settings.CUSTOM_CANVAS_ROLES[role]
            
            response = section._requester.request(
                "POST",
                f"sections/{section_id}/enrollments",
                _kwargs=list(enrollment_params.items())
            )
            allowed_fields = ['id', 'course_id', 'course_section_id', 'user_id', 'type']
            enrollment_result = Enrollment(section._requester, response.json())
            serializer = CanvasObjectROSerializer(enrollment_result, allowed_fields=allowed_fields)
            return serializer.data
        except (CanvasException, Exception) as e:
            raise