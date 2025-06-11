import logging
from http import HTTPStatus
from canvasapi import Canvas
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
    courses_allowed_fields = {"id"}

    def __init__(self, credential_manager=None):
        self.credential_manager = credential_manager or CanvasCredentialManager()
        self.canvas_error = CanvasErrorHandler()
        super().__init__()

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
        
        canvas_api: Canvas = self.credential_manager.get_canvasapi_instance(request)
        try:
            # Get accounts accessible to the admin user
            accounts_by_account_id = {}
            logger.info(f"Retrieving admin sections data for term_id: {term_id}")
            accounts = canvas_api.get_accounts()
            for account in accounts:
                logger.info(f"Account ID: {account.id}, Name: {account.name}, Parent Account ID: {account.parent_account_id}")
                accounts_by_account_id[account.id] = account

            filtered_account_ids = [
                account.id for account in accounts_by_account_id.values() if
                    # account is the root account OR the subaccount of an unlisted account
                    account.parent_account_id is None 
                    or not(account.parent_account_id in accounts_by_account_id.keys())
            ]
            logger.info(f"Found {len(filtered_account_ids)} of {len(accounts_by_account_id)} accounts accessible to the admin user.")

            # Build term and search parameters for course search
            queryParams = {
                'state': ['created', 'claimed', 'available'],
                'enrollment_term_id': term_id,
                'per_page': 100,
            }
            if instructor_name:
                queryParams['by_teachers'] = ['sis_login_id:' + instructor_name]
                logger.info(f"Searching for courses with instructor name: {instructor_name}")
            if course_name:
                queryParams['search_term'] = course_name
                logger.info(f"Searching for courses with name: {course_name}")

            # Get sections from all courses for filtered accounts
            filtered_accounts_course_sections = []
            for account_id in filtered_account_ids:
                # First retrieve courses for the account
                logger.info(f"Retrieving courses for account_id: {account_id}")
                account = accounts_by_account_id[account_id]
                courses = account.get_courses(**queryParams)
                courses_serializer = CanvasObjectROSerializer(courses, allowed_fields=self.courses_allowed_fields, many=True)
                courses_data = courses_serializer.data
                
                # Get sections for each course
                logger.info(f"Getting sections for {len(courses_data)} courses from account_id: {account_id}")
                for course in courses_data:
                    logger.info(f"Getting sections for course with id: {course.get('id')}")
                    course_id = course.get('id')
                    if course_id:
                        # Get section data to append to course data in response
                        sections = CanvasCourseSectionAPIHandler.retrieve_sections_from_course_id(
                            canvas_api,
                            course_id,
                            course_section_allowed_fields=CanvasCourseSectionAPIHandler.course_section_allowed_fields,
                            include=['total_students']
                        )
                        course['sections'] = sections
                        logger.info(f"Found {len(sections)} courses across all filtered accounts.")
                        filtered_accounts_course_sections.append(course)

            return Response(filtered_accounts_course_sections, status=HTTPStatus.OK)
        except (CanvasException, Exception) as e:
            self.canvas_error.handle_canvas_api_exceptions(HTTPAPIError(str(request.data), e))
            return Response(self.canvas_error.to_dict(), status=self.canvas_error.to_dict().get('statusCode'))
