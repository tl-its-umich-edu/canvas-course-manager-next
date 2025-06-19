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

class CanvasInstructorSectionsAPIHandler(LoggingMixin, APIView):
    """
    API handler for "merge-able" sections data for users with instructor-level access
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

    def get(self, request:Request) -> Response:
        """
        Get sections data from Canvas for instructors.
        """
        term_id = request.query_params.get('term_id', None)
        if not term_id:
            Response({"error": "Term ID is required as a parameter"}, status=HTTPStatus.BAD_REQUEST)

        canvas_api: Canvas = self.credential_manager.get_canvasapi_instance(request)
        course_instance_map = {}
        try:
            logger.info(f"Retrieving instructor sections data for term_id: {term_id}")
            courses = canvas_api.get_courses(enrollment_type='teacher')
            course_instance_map = {course.id: course for course in courses}

            # access the serialized courses data, filtered by term_id
            serializer = CanvasObjectROSerializer(courses, allowed_fields=self.courses_allowed_fields, many=True)
            filtered_courses_data = [course for course in serializer.data if course.get('enrollment_term_id') == int(term_id)]
            logger.debug(f"Found {len(filtered_courses_data)} courses with term_id {term_id} for instructor-level user.")
            logger.info(f"Filtered courses data: {filtered_courses_data}")
        except (CanvasException, Exception) as e:
            failed_input = f"user {request.user}, term_id {term_id}"
            self.canvas_error.handle_canvas_api_exceptions(HTTPAPIError(failed_input, e))
            return Response(self.canvas_error.to_dict(), status=self.canvas_error.to_dict().get('statusCode'))
        
        for course_data in filtered_courses_data:
            api_errors = []
            try:
                course_id = course_data.get('id')
                logger.info(f"Retrieving sections for course_id: {course_id}")
                
                # Retrieve sections for each course instance
                course_instance = course_instance_map.get(course_id)
                sections = course_instance.get_sections(
                    include=['total_students'], per_page=100
                )
                serializer = CanvasObjectROSerializer(sections, allowed_fields=self.sections_allowed_fields, many=True)
                sections_data = serializer.data
                course_data['sections'] = sections_data
                logger.info(f"Retrieved {len(sections_data)} sections for course_id: {course_id}")
            except (CanvasException, Exception) as e:
                api_errors.append(HTTPAPIError(str(course_id), e))
                logger.error(f"Error retrieving sections for course_id {course_id}: {e}")
                continue
        if api_errors:
            self.canvas_error.handle_canvas_api_exceptions(api_errors)
            return Response(self.canvas_error.to_dict(), status=self.canvas_error.to_dict().get('statusCode'))

        logger.debug(f"Sections data for instructors appended to course response data")
        return Response(filtered_courses_data, status=HTTPStatus.OK)