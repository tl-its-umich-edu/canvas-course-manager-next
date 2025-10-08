import asyncio
from http import HTTPStatus
import logging
from rest_framework import authentication, permissions
from rest_framework.views import APIView
from rest_framework_tracking.mixins import LoggingMixin
from rest_framework.response import Response
from rest_framework.request import Request
from asgiref.sync import async_to_sync
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from itertools import islice

from canvasapi.exceptions import CanvasException
from canvasapi.account import Account
from canvasapi.course import Course
from backend.ccm.canvas_api.canvas_credential_manager import CanvasCredentialManager
from backend.ccm.canvas_api.constants import MAX_CONCURRENCY, MAX_SEARCH_COURSES
from backend.ccm.canvas_api.exceptions import CanvasErrorHandler, HTTPAPIError
from backend.ccm.canvas_api.canvasapi_serializer import AdminSectionsQuerySerializer, CanvasObjectROSerializer

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
    serializer_class = AdminSectionsQuerySerializer  # Ensures Swagger UI recognizes it
    COURSE_LIMIT_ERROR_MESSAGE = 'Too many courses matched your search term; please refine your search.'

    def __init__(self, credential_manager=None):
        self.credential_manager = credential_manager or CanvasCredentialManager()
        self.canvas_error = CanvasErrorHandler()
        super().__init__()

    @extend_schema(
        operation_id="get_admin_sections",
        description="Get mergeable sections data from Canvas for admin users, filtered by term_id and either instructor_name or course_name.",
        request=AdminSectionsQuerySerializer,
        parameters=[
            OpenApiParameter(
                name="term_id",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=True,
                description="Canvas term ID to filter courses."
            ),
            OpenApiParameter(
                name="instructor_name",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=False,
                description="Instructor's login ID to filter courses. Provide either this or course_name."
            ),
            OpenApiParameter(
                name="course_name",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=False,
                description="Course name to filter courses. Provide either this or instructor_name."
            )
        ],
    )
    def get(self, request: Request) -> Response:
        """
        Get sections data from Canvas for admins.
        """
        serializer = AdminSectionsQuerySerializer(data=request.query_params)
        if not serializer.is_valid():
            self.canvas_error.handle_serializer_errors(serializer.errors, f"{request.query_params}")
            return Response(self.canvas_error.to_dict(), status=self.canvas_error.to_dict().get('statusCode'))
        validated_data = serializer.validated_data
        term_id = validated_data.get('term_id')
        instructor_name = validated_data.get('instructor_name')
        course_name = validated_data.get('course_name')
        
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
            accessible_account_ids, account_instance_map = self._get_accessible_accounts(canvas_api, request.user.username, course_name, instructor_name)
            if not accessible_account_ids:
                logger.info(f"No accessible accounts found for admin user {request.user.username} with id {request.user.id}")
                return Response([], status=HTTPStatus.OK) # Return empty list if no accounts are accessible
            
            #2. Get courses by account, by search parameters and term_id
            course_instance_map = {}
            courses_success, courses_response = self._get_courses(coursesQueryParams, course_instance_map, accessible_account_ids, account_instance_map)
            if not courses_success:
                self.canvas_error.handle_canvas_api_exceptions(courses_response)
                return Response(self.canvas_error.to_dict(), status=self.canvas_error.to_dict().get('statusCode'))

            if len(courses_response) >= MAX_SEARCH_COURSES:
                relevantParams: str = self._error_message_too_many_courses(coursesQueryParams)
                self.canvas_error.handle_canvas_api_exceptions(HTTPAPIError(relevantParams, Exception(self.COURSE_LIMIT_ERROR_MESSAGE)))
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

    def _error_message_too_many_courses(self, coursesQueryParams) -> str:
        relevantParams = {'by_teachers': coursesQueryParams.get('by_teachers'), 'search_term': coursesQueryParams.get('search_term')}
        logger.error(f"Query with the following search term(s) returned too many course results: {relevantParams}")
        return str(relevantParams)
        
    def _get_accessible_accounts(self, canvas_api, username, course_name, instructor_name) -> tuple[list[dict], dict[int, Account]]:
        # Retrieve all user accounts, filter to root accounts and subaccounts of unlisted accounts
        logger.info(f"Retrieving accessible accounts for user {username}")
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
            return accessible_account_ids, account_instance_map
        except (CanvasException, Exception) as e:
            failed_input = f"username {username}, course_name {course_name}, instructor_name {instructor_name}"
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
            logger.info(f"Retrieving courses from account id {account.id}")
            account_courses = list(islice(account.get_courses(**coursesQueryParams), MAX_SEARCH_COURSES))
            logger.info(f"Retrieved courses {len(account_courses)} courses from account id {account.id}")

            # Number of courses cannot exceed maxiumum
            if len(account_courses) >= MAX_SEARCH_COURSES:
                self._error_message_too_many_courses(coursesQueryParams)
                raise Exception(self.COURSE_LIMIT_ERROR_MESSAGE)

            course_instance_map.update({course.id: course for course in account_courses})
            serializer = CanvasObjectROSerializer(account_courses, allowed_fields=self.courses_allowed_fields, many=True)
            filtered_courses_data.extend(serializer.data)
            logger.info(f"Found {len(serializer.data)} courses in account id {account.id} matching search criteria")
        except (CanvasException, Exception) as e:
            failed_input = f"account id {account.id} with params {coursesQueryParams}"
            raise HTTPAPIError(failed_input, e)
    
    @async_to_sync
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
        
    def _attach_section_sync(
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
                return await asyncio.to_thread(sync_func,*args, **kwargs)
            except Exception as e:
                errors.append(e if isinstance(e, HTTPAPIError) else HTTPAPIError(str(args), e))
                