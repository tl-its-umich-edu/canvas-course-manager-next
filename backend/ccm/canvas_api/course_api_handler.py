import logging
from http import HTTPStatus
from rest_framework.views import APIView
from rest_framework import authentication, permissions
from rest_framework.response import Response
from rest_framework.request import Request

from canvasapi.exceptions import CanvasException
from .exceptions import CanvasHTTPError

from backend.ccm.canvas_api.get_user_canvas_token import CanvasCredentialHolder

logger = logging.getLogger(__name__)

CANVAS_CREDENTIALS = CanvasCredentialHolder()

class CanvasCourseAPIHandler(APIView):
    """
    API handler for Canvas course data.
    """
    authentication_classes = [authentication.SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]


    def get(self, request: Request, course_id: int) -> Response:
        """
        Get course data from Canvas.
        """
        try:
            canvas_api = CANVAS_CREDENTIALS.get_canvasapi_instance(request)
            logger.info(f"Getting course data for course_id: {course_id}")
            
            # Call the Canvas API package to get course details.
            course = canvas_api.get_course(course_id)
            logger.info(f"Course data retrieved: {course}")
            
            # Format the course object to return specific course info
            formatted_course = {
                "id": course.id,
                "name": course.name,
                "enrollment_term_id": course.enrollment_term_id
            }
            
            return Response(formatted_course, status=HTTPStatus.OK)
        except CanvasException as e:
            logger.error(f"Canvas API error: {e}")
            err_response: CanvasHTTPError = CANVAS_CREDENTIALS.handle_canvas_api_exception(e, course_id)
            return Response(err_response.to_dict(), status=err_response.status_code)
            