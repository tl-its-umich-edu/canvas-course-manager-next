import logging
from http import HTTPStatus
from rest_framework.views import APIView
from rest_framework import authentication, permissions
from rest_framework.response import Response
from rest_framework.request import Request

from canvasapi.exceptions import CanvasException
from canvasapi.course import Course
from canvasapi import Canvas

from backend.ccm.canvas_api.canvasapi_serializer import AddSectionInputSerializer, SectionSerializer
from .exceptions import CanvasHTTPError
from canvas_oauth.exceptions import InvalidOAuthReturnError

from backend.ccm.canvas_api.canvas_credential_manager import CanvasCredentialManager

from drf_spectacular.utils import extend_schema
from rest_framework_tracking.mixins import LoggingMixin

logger = logging.getLogger(__name__)

CANVAS_CREDENTIALS = CanvasCredentialManager()

class CanvasSectionAPIHandler(LoggingMixin, APIView):
    logging_methods = ['GET', 'POST']
    """"
    "API handler for Canvas section data."
    """
    authentication_classes = [authentication.SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SectionSerializer  # Ensures Swagger UI recognizes it

    def get(self, request: Request, course_id: int) -> Response:
        """
        Get section data from Canvas.
        """
        try:
            canvas_api: Canvas = CANVAS_CREDENTIALS.get_canvasapi_instance(request)
            logger.info(f"Retrieving course for section data with course_id: {course_id}")
            course: Course = canvas_api.get_course(course_id)
            logger.info(f"Course data retrieved: {course}")
            
            # Call the Canvas API package to get section details.
            logger.info(f"Getting section data for course")
            # Get list of sections, including total_students info
            sections = course.get_sections(include=['total_students'])
            logger.info(f"Section data retrieved: {sections}")
            
            # Format the section data to return specific section info
            formatted_sections = []
            for section in sections:
                formatted_sections.append({
                    "id": section.id,
                    "name": section.name,
                    "course_id": section.course_id,
                    "total_students": section.total_students,
                    "nonxlist_course_id": section.nonxlist_course_id
                })
            
            return Response(formatted_sections, status=HTTPStatus.OK)
        except (CanvasException, InvalidOAuthReturnError, Exception) as e:
            err_response: CanvasHTTPError = CANVAS_CREDENTIALS.handle_canvas_api_exception(e, request, str(course_id))
            return Response(err_response.to_dict(), status=err_response.status_code)
        
    @extend_schema(
        operation_id="add_sections",
        summary="Add sections to a course",
        description="Takes a list of section names to add to a specific course.",
        request=AddSectionInputSerializer,
    )
    def post(self, request: Request, course_id: int) -> Response:
        """
        Add sections to a course in Canvas
        """
        try:
            # Validate the incoming data using the serializer.
            serializer = AddSectionInputSerializer(data=request.data)
            if not serializer.is_valid():
                err_response: CanvasHTTPError = CanvasCredentialManager.handle_serializer_errors(serializer.errors, request.data)
                return Response(err_response.to_dict(), status=err_response.status_code)
        
            canvas_api: Canvas = CANVAS_CREDENTIALS.get_canvasapi_instance(request)
            logger.info(f"Creating new section for course_id: {course_id}")
            course: Course = canvas_api.get_course(course_id)
            logger.info(f"Course data retrieved: {course}")
            
            # Create new sections for the course
            formatted_sections = []
            for sectionName in request.data['sectionNames']:
                logger.info(f"Creating new section with name: {sectionName}")
                new_section = course.create_course_section(course_section={
                    'name' : sectionName
                })
                # Format the section data to return specific section info
                formatted_section = {
                    "id": new_section.id,
                    "name": new_section.name,
                    "course_id": new_section.course_id,
                    "total_students": 0,
                    "nonxlist_course_id": new_section.nonxlist_course_id
                }
                logger.info(f"Formatted section data: {formatted_section}")
                formatted_sections.append(formatted_section)
            
            return Response(formatted_sections, status=HTTPStatus.OK)
        except (CanvasException, InvalidOAuthReturnError, Exception) as e:
            err_response: CanvasHTTPError = CANVAS_CREDENTIALS.handle_canvas_api_exception(e, request, str(course_id))
            return Response(err_response.to_dict(), status=err_response.status_code)

