from dataclasses import dataclass
import logging
from http import HTTPStatus
from rest_framework.views import APIView
from rest_framework import authentication, permissions
from rest_framework.response import Response
from rest_framework.request import Request

from canvasapi.exceptions import CanvasException
from canvasapi.course import Course
from canvasapi import Canvas

from .exceptions import CanvasHTTPError
from canvas_oauth.exceptions import InvalidOAuthReturnError

from backend.ccm.canvas_api.canvas_credential_manager import CanvasCredentialManager

from rest_framework_tracking.mixins import LoggingMixin

logger = logging.getLogger(__name__)

CANVAS_CREDENTIALS = CanvasCredentialManager()

@dataclass
class Section:
    id: int
    name: str
    course_id: int
    total_students: int
    nonxlist_course_id: int
class CourseSectionAPIHandler(LoggingMixin, APIView):
    logging_methods = ['GET']
    """"
    "API handler for Canvas section data."
    """
    authentication_classes = [authentication.SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request, course_id: int) -> Response:
        """
        Get section data from Canvas.
        """
        try:
            canvas_api: Canvas = CANVAS_CREDENTIALS.get_canvasapi_instance(request)
            
            # Call the Canvas API package to get section details.
            logger.info(f"Retrieving course for section data with course_id: {course_id}")
            # Get list of sections, including total_students info
            sections = canvas_api.get_course(course_id).get_sections(include=['total_students'], per_page=100)
            
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
            logger.info(f"Formatted section data: {formatted_sections}")
            return Response(formatted_sections, status=HTTPStatus.OK)
        except (CanvasException, InvalidOAuthReturnError, Exception) as e:
            err_response: CanvasHTTPError = CANVAS_CREDENTIALS.handle_canvas_api_exception(e, request, str(course_id))
            return Response(err_response.to_dict(), status=err_response.status_code)
