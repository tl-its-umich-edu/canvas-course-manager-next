import asyncio
from http import HTTPStatus
import logging
from rest_framework import authentication, permissions
from rest_framework.views import APIView
from rest_framework_tracking.mixins import LoggingMixin
from rest_framework.response import Response
from rest_framework.request import Request
from asgiref.sync import async_to_sync

from canvasapi.exceptions import CanvasException
from canvasapi.account import Account
from canvasapi.course import Course
from backend.ccm.canvas_api.canvas_credential_manager import CanvasCredentialManager
from backend.ccm.canvas_api.constants import MAX_CONCURRENCY
from backend.ccm.canvas_api.exceptions import CanvasErrorHandler, HTTPAPIError
from backend.ccm.canvas_api.canvasapi_serializer import CanvasObjectROSerializer
from backend.ccm.canvas_api.instructor_sections_api_handler import CanvasInstructorSectionsAPIHandler
from backend.ccm.utils import timeit

logger = logging.getLogger(__name__)

class CanvasAdminSectionsAPIHandler(LoggingMixin, APIView):
    """
    API handler for "merge-able" sections data for users with admin access
    """
    logging_methods = ['GET']
    authentication_classes = [authentication.SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    courses_allowed_fields = {"id", "name", "enrollment_term_id"}
    sections_allowed_fields = {"id", "name", "course_id", "nonxlist_course_id", "total_students"}

    def __init__(self, credential_manager=None):
        self.credential_manager = credential_manager or CanvasCredentialManager()
        self.canvas_error = CanvasErrorHandler()
        super().__init__()

    @timeit
    def get(self, request: Request) -> Response:
        """
        Get sections data from Canvas for admins.
        """
        term_id = request.query_params.get('term_id', None)
        instructor_name = request.query_params.get('instructor_name', None)
        course_name = request.query_params.get('course_name', None)
        if not term_id:
            return Response({"error": "Term ID is required as a parameter"}, status=HTTPStatus.BAD_REQUEST)
        if not ((instructor_name != None) ^ (course_name != None)): # XOR condition ensures one, but not both, is provided
            return Response({"error": "Provide either 'instructor_name' or 'course_name' as a parameter. Both cannot be provided together."},
                            status=HTTPStatus.BAD_REQUEST)
        
        # Prepare query parameters for course search
        coursesQueryParams = {
                'state': ['created', 'claimed', 'available'],
                'enrollment_term_id': term_id,
                'per_page': 100,
            }
        if instructor_name:
            coursesQueryParams['by_teachers'] = ['sis_login_id:' + instructor_name]
            logger.info(f"Searching for courses with instructor name: {instructor_name}")
        if course_name:
            coursesQueryParams['search_term'] = course_name
            logger.info(f"Searching for courses with name: {course_name}")

        canvas_api = self.credential_manager.get_canvasapi_instance(request)
        try:
            # 1. Get all accessible accounts
            accessible_account_ids, account_instance_map = self._get_accessible_accounts(canvas_api)

            #2. Get courses by account, by search parameters and term_id
            course_instance_map = {}
            courses_success, courses_response = self._get_courses(coursesQueryParams, course_instance_map, accessible_account_ids, account_instance_map)
            if not courses_success:
                self.canvas_error.handle_canvas_api_exceptions(courses_response)
                return Response(self.canvas_error.to_dict(), status=self.canvas_error.to_dict().get('statusCode'))
            
            #3. Attach sections to course results
            sections_success, sections_response = self._attach_sections_to_courses(courses_response, course_instance_map)
            if not sections_success:
                self.canvas_error.handle_canvas_api_exceptions(sections_response)
                return Response(self.canvas_error.to_dict(), status=self.canvas_error.to_dict().get('statusCode'))
            else:
                return Response(sections_response, status=HTTPStatus.OK)
        except (HTTPAPIError) as e:
            self.canvas_error.handle_canvas_api_exceptions(e)
            logger.error(f"Error retrieving admin sections for user id {request.user.id}")
            return Response(self.canvas_error.to_dict(), status=self.canvas_error.to_dict().get('statusCode'))
        
    def _get_accessible_accounts(self, canvas_api) -> tuple[list[dict], dict[int, Account]]:
        # Retrieve all user accounts, filter to root accounts and subaccounts of unlisted accounts
        logger.info("Retrieving accessible accounts for admin user")
        try:
            accounts = list(canvas_api.get_accounts())
            account_instance_map: dict[int, Account] = {account.id: account for account in accounts}
            accessible_account_ids = [
                key for key, account in account_instance_map.items() if
                    # account is the root account OR the subaccount of an unlisted account
                    account.parent_account_id is None 
                    or not(account.parent_account_id in account_instance_map)
            ]
            logger.info(f"Found {len(accessible_account_ids)} of {len(accounts)} accounts accessible to admin user")
        except (CanvasException, Exception) as e:
            failed_input = f"user id {canvas_api._Canvas__requester.user_id}"
            raise HTTPAPIError(failed_input, e)
        
    @async_to_sync
    async def _get_courses(
            self, 
            coursesQueryParams: dict,
            course_instance_map: dict[int, Course],
            accessible_account_ids: list[int], 
            account_instance_map: dict[int, Account]
        ) -> tuple[bool, list[dict] | list[HTTPAPIError]]:
        """ Fetch courses from all accessible accounts based on coursesQueryParams, guarded by a semaphore for concurrency control."""
        max_concurrent = MAX_CONCURRENCY 
        semaphore = asyncio.Semaphore(max_concurrent)
        errors = []

        filtered_courses_data = []
        tasks = [self._run_with_semaphore(
            semaphore,
            errors,
            self._get_courses_by_account_sync,
            filtered_courses_data,
            course_instance_map,
            coursesQueryParams,
            account_instance_map[account_id]
        ) for account_id in accessible_account_ids]
        await asyncio.gather(*tasks, return_exceptions=True)
        
        success = len(errors) == 0 # boolean to indicate if errors occurred
        return success, filtered_courses_data if success else errors
        
    def _get_courses_by_account_sync(
            self, 
            filtered_courses_data: list, 
            course_instance_map: dict[int, Course],
            coursesQueryParams: dict, 
            account: Account):
        """ Synchronous helper to fetch and append courses from a given account. """
        try:
            account_courses = list(account.get_courses(**coursesQueryParams))
            course_instance_map.update({course.id: course for course in account_courses})
            serializer = CanvasObjectROSerializer(account_courses, allowed_fields=self.courses_allowed_fields, many=True)
            filtered_courses_data.extend(serializer.data)
            logger.info(f"Found {len(serializer.data)} courses in account id {account.id} matching search criteria")
        except (CanvasException, Exception) as e:
            failed_input = f"account id {account.id} with params {coursesQueryParams}"
            raise HTTPAPIError(failed_input, e)
    
    async def _attach_sections_to_courses(
            self, 
            courses_data:list[dict], 
            course_instance_map:dict[int, Course]
        ) -> tuple[bool, list[dict] | list[HTTPAPIError]]:
        max_concurrent = MAX_CONCURRENCY 
        semaphore = asyncio.Semaphore(max_concurrent)
        errors = []

        tasks = [self._run_with_semaphore(
            semaphore,
            errors,
            self._attach_section_sync,
            course,
            course_instance_map.get(course.get('id'))
        ) for course in courses_data]
        await asyncio.gather(*tasks, return_exceptions=True)

        success = len(errors) == 0
        return success, courses_data if success else errors
        
    async def _attach_section_sync(
            self, 
            course: dict, 
            course_instance: Course):
        """ Synchronous helper to fetch and attach sections to a course. """
        try:
            sections = course_instance.get_sections(include=['total_students'], per_page=100)
            section_serializer = CanvasObjectROSerializer(sections, allowed_fields=self.sections_allowed_fields, many=True)
            course['sections'] = section_serializer.data
            logger.info(f"Attached {len(course['sections'])} sections to course_id {course.get('id')}")
        except (CanvasException, Exception) as e:
            failed_input = f"course id {course.get('id')}"
            raise HTTPAPIError(failed_input, e)
    
    async def _run_with_semaphore(
            self, 
            semaphore: asyncio.Semaphore, 
            errors:list, 
            sync_func: callable, 
            *args, 
            **kwargs):
        """ Run a synchronous function within a semaphore to limit concurrency, capturing errors. """
        async with semaphore:
            try:
                await sync_func(*args, **kwargs)
            except Exception as e:
                errors.append(e if isinstance(e, HTTPAPIError) else HTTPAPIError(str(args), e))
                