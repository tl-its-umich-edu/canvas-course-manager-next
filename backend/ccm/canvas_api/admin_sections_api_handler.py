import asyncio
import logging
from http import HTTPStatus
import time
from canvasapi import Canvas
from canvasapi.account import Account
from canvasapi.course import Course
from rest_framework.views import APIView
from rest_framework import authentication, permissions
from rest_framework_tracking.mixins import LoggingMixin
from rest_framework.response import Response
from rest_framework.request import Request

from canvasapi.exceptions import CanvasException
from backend.ccm.canvas_api.canvas_credential_manager import CanvasCredentialManager
from backend.ccm.canvas_api.canvasapi_serializer import CanvasObjectROSerializer
from backend.ccm.canvas_api.course_section_api_handler import CanvasCourseSectionAPIHandler
from backend.ccm.canvas_api.exceptions import CanvasErrorHandler, HTTPAPIError

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
    
    def get(self, request: Request) -> Response:
        return asyncio.run(self.get_async(request))

    async def get_async(self, request: Request) -> Response:
        """
        Get sections data from Canvas for admins.
        """
        start_time: float = time.perf_counter()
        term_id = request.query_params.get('term_id', None)
        instructor_name = request.query_params.get('instructor_name', None)
        course_name = request.query_params.get('course_name', None)

        if not term_id:
            return Response({"error": "Term ID is required as a parameter"}, status=HTTPStatus.BAD_REQUEST)
        
        if not ((instructor_name != None) ^ (course_name != None)): # XOR condition ensures one, but not both, is provided
            return Response({"error": "Provide either 'instructor_name' or 'course_name' as a parameter. Both cannot be provided together."},
                            status=HTTPStatus.BAD_REQUEST)
        time_get_canvas_api_start: float = time.perf_counter()
        canvas_api: Canvas = await asyncio.to_thread(self.credential_manager.get_canvasapi_instance, request)
        time_get_canvas_api_end: float = time.perf_counter()
        logger.info(f"TIME taken to get Canvas API instance: {time_get_canvas_api_end - time_get_canvas_api_start:.2f} seconds")
        
        logger.info(f"Retrieving admin sections data for term_id: {term_id}")
        time_filter_accounts_start: float = time.perf_counter()
        try:
            # Get accounts accessible to the admin user
            accounts_by_account_id = await self.retrieve_accounts_map(canvas_api)
            filtered_account_ids = [
                account.id for account in accounts_by_account_id.values() if
                    # account is the root account OR the subaccount of an unlisted account
                    account.parent_account_id is None 
                    or not(account.parent_account_id in accounts_by_account_id.keys())
            ]
            logger.info(f"Found {len(filtered_account_ids)} of {len(accounts_by_account_id)} accounts accessible to the admin user.")
        except (CanvasException, Exception) as e:
            failed_input = f"user {request.user}"
            self.canvas_error.handle_canvas_api_exceptions(HTTPAPIError(failed_input, e))
            return Response(self.canvas_error.to_dict(), status=self.canvas_error.to_dict().get('statusCode'))
        time_filter_accounts_end: float = time.perf_counter()
        logger.info(f"TIME taken to filter accounts: {time_filter_accounts_end - time_filter_accounts_start:.2f} seconds")
        
        # Build term and search parameters for course search
        courseQueryParams = {
            'state': ['created', 'claimed', 'available'],
            'enrollment_term_id': term_id,
            'per_page': 100,
        }
        if instructor_name:
            courseQueryParams['by_teachers'] = ['sis_login_id:' + instructor_name]
            logger.info(f"Searching for courses with instructor name: {instructor_name}")
        if course_name:
            courseQueryParams['search_term'] = course_name
            logger.info(f"Searching for courses with name: {course_name}")
        
        # Get sections from all courses for filtered accounts
        courses_with_sections_results = []
        courses_with_sections_errors = []
        time_fetch_all_sections_start: float = time.perf_counter()
        async with asyncio.TaskGroup() as tg:
            for account_id in filtered_account_ids:
                account = accounts_by_account_id[account_id]
                tg.create_task(
                    fetch_sections_for_account_task(
                        account,
                        courseQueryParams,
                        self.courses_allowed_fields,
                        self.sections_allowed_fields,
                        courses_with_sections_results, 
                        courses_with_sections_errors)
                )
        time_fetch_all_sections_end: float = time.perf_counter()
        logger.info(f"TIME taken to fetch sections for all accounts: {time_fetch_all_sections_end - time_fetch_all_sections_start:.2f} seconds")

        if courses_with_sections_errors:
            self.canvas_error.handle_canvas_api_exceptions(courses_with_sections_errors)
            error_response = self.canvas_error.to_dict()
            return Response(error_response, status=error_response.get('statusCode'))
        
        end_time: float = time.perf_counter()
        logger.info(f"TIME TOTAL taken to get sections: {end_time - start_time:.2f} seconds")
        return Response(courses_with_sections_results, status=HTTPStatus.OK)
    
async def retrieve_accounts_map(canvas_api: Canvas) -> dict:
    """
    Retrieve accounts accessible to the admin user.
    """
    accounts_by_account_id = {}
    time_get_accounts_start: float = time.perf_counter()
    accounts = await asyncio.to_thread(canvas_api.get_accounts)
    time_get_accounts_end: float = time.perf_counter()
    logger.info(f"TIME taken to get accounts: {time_get_accounts_end - time_get_accounts_start:.2f} seconds")
    for account in accounts:
        logger.info(f"Account ID: {account.id}, Name: {account.name}, Parent Account ID: {account.parent_account_id}")
        accounts_by_account_id[account.id] = account
    return accounts_by_account_id

async def fetch_sections_for_account_task(
        account: Account, 
        courseQueryParams: dict, 
        courses_allowed_fields: set,
        sections_allowed_fields: set,
        results: list,
        errors: list
    ) -> list:
    # First retrieve cour+ses for the account
    courses = []
    time_get_courses_start: float = time.perf_counter()
    try:
        def get_courses(courseQueryParams):
            return account.get_courses(**courseQueryParams)
        logger.info(f"Retrieving courses for account_id: {account.id}")
        courses = await asyncio.to_thread(get_courses, courseQueryParams)
    except (CanvasException, Exception) as e:
        errors.append(HTTPAPIError(f"account {account.id}, course request {str(courseQueryParams)}", e))
    time_get_courses_end: float = time.perf_counter()
    logger.info(f"TIME taken to get courses for account_id {account.id}: {time_get_courses_end - time_get_courses_start:.2f} seconds")
    # New taskgroup to handle sections retrieval
    async with asyncio.TaskGroup() as section_tg:
        logger.info(f"Getting sections for courses from account_id: {account.id}")
        for course in courses:
            try:
                course_serializer = CanvasObjectROSerializer(course, allowed_fields=courses_allowed_fields)
                course_data = course_serializer.data
                
                time_get_sections_start: float = time.perf_counter()
                # Create a task for each course to fetch its sections
                section_tg.create_task(fetch_sections_for_course_task(course, course_data,sections_allowed_fields, results)) 
                time_get_sections_end: float = time.perf_counter()
                logger.info(f"TIME taken to get sections for course_id {course.id}: {time_get_sections_end - time_get_sections_start:.2f} seconds")
            except (CanvasException, Exception) as e:
                errors.append(HTTPAPIError(str(course.id), e))
                logger.error(f"Error retrieving sections for course_id {course.id}: {e}")
                continue
    return results

# Closure to fetch sections for each course
async def fetch_sections_for_course_task(course: Course, course_data: dict, sections_allowed_fields: set,  results: list):
    logger.info(f"Getting sections for course with id: {course.id}")
    time_retrieve_section_data_start: float = time.perf_counter()
    sections_data = await asyncio.to_thread(retrieve_section_data, course, sections_allowed_fields)
    time_retrieve_section_data_end: float = time.perf_counter()
    logger.info(f"TIME taken to retrieve sections for course_id {course.id}: {time_retrieve_section_data_end - time_retrieve_section_data_start:.2f} seconds")
    course_data['sections'] = sections_data
    results.append(course_data)

def retrieve_section_data(course: Course, sections_allowed_fields: set) -> list:
    """
    Retrieve sections data from a course.
    """
    sections = course.get_sections(include=['total_students'], per_page=100)
    serializer = CanvasObjectROSerializer(sections, allowed_fields=sections_allowed_fields, many=True)
    return serializer.data