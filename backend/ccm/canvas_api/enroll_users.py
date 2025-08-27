import logging
from canvasapi.section import Section
from canvasapi.enrollment import Enrollment
from canvasapi import Canvas
from canvasapi.exceptions import CanvasException

from django.conf import settings
from .constants import ROLE_TO_ENROLLMENT_TYPE
logger = logging.getLogger(__name__)

def process_login_id(login_id: str) -> str:
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
            "enrollment[user_id]": f"sis_login_id:{process_login_id(login_id)}",
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
        return Enrollment(section._requester, response.json())
    except (CanvasException, Exception) as e:
        raise
