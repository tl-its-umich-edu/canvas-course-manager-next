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

    def get(self, request: Request) -> Response:
        term_id = request.query_params.get('term_id')
        if not term_id:
            return Response({"error": "Term ID is required as a parameter"}, status=HTTPStatus.BAD_REQUEST)
        try:
            canvas_api = self.credential_manager.get_canvasapi_instance(request)
            filtered_courses, course_instance_map = self._get_filtered_teacher_courses(canvas_api, term_id)
            response_data = self._attach_sections_to_courses(filtered_courses, course_instance_map)
            return Response(response_data, status=HTTPStatus.OK)
        except (HTTPAPIError) as e:
            self.canvas_error.handle_canvas_api_exceptions(e)
            logger.error(f"Error retrieving instructor sections for user id {request.user.id}")
            return Response(self.canvas_error.to_dict(), status=self.canvas_error.to_dict().get('statusCode'))

    def _get_filtered_teacher_courses(self, canvas_api: Canvas, term_id: str):
        """Fetch and filter teacher courses by term_id and a map of the course instances. Returns (filtered_courses, course_instance_map)."""
        logger.info(f"Retrieving instructor courses for term_id: {term_id}")
        try:
            courses = canvas_api.get_courses(enrollment_type='teacher')
            course_instance_map = {course.id: course for course in courses}
            serializer = CanvasObjectROSerializer(courses, allowed_fields=self.courses_allowed_fields, many=True)
            filtered_courses = [course for course in serializer.data if course.get('enrollment_term_id') == int(term_id)]
            logger.info(f"Filtered to {len(filtered_courses)} courses for term_id {term_id}")
            return filtered_courses, course_instance_map
        except (CanvasException, Exception) as e:
            failed_input = f"term_id {term_id}"
            raise HTTPAPIError(failed_input, e)


    def _attach_sections_to_courses(self, courses_data, course_instance_map):
        """Attach sections to each course in courses_data."""
        for course in courses_data:
            course_id = course.get('id')
            try:
                course_instance = course_instance_map.get(course_id)
                sections = course_instance.get_sections(include=['total_students'], per_page=100)
                section_serializer = CanvasObjectROSerializer(sections, allowed_fields=self.sections_allowed_fields, many=True)
                course['sections'] = section_serializer.data
                logger.info(f"Attached {len(course['sections'])} sections to course_id {course_id}")
            except (CanvasException, Exception) as e:
                failed_input = f"course id {course_id}"
                raise HTTPAPIError(failed_input, e)
        return courses_data