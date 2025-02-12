import logging
from http import HTTPStatus
from rest_framework.views import APIView
from rest_framework import authentication, permissions
from rest_framework.response import Response
from rest_framework.request import Request

from canvasapi.exceptions import CanvasException
from canvasapi.course import Course

from backend.ccm.canvas_api.canvasapi_serializer import CourseSerializer
from .exceptions import CanvasHTTPError

from backend.ccm.canvas_api.get_user_canvas_token import CanvasCredentialHolder

from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample

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
            course: Course = canvas_api.get_course(course_id)
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
      
    @extend_schema(
        operation_id="update_course",
        summary="Update Course",
        description="Update the details of a specific course.",
        request=CourseSerializer,
    )
    def put(self, request: Request, course_id: int) -> Response:
        # Validate the incoming data using the serializer.
        serializer = CourseSerializer(data=request.data)
        if serializer.is_valid():
            update_data = serializer.validated_data
            try:
                canvas_api = CANVAS_CREDENTIALS.get_canvasapi_instance(request)
                # Get the course instance
                course: Course = canvas_api.get_course(course_id)
                # Call the update method on the course instance
                put_course_res: str= course.update(course={'name': update_data.get("newName"), 'course_code': update_data.get("newName")})
                formatted_course = {'id': course.id, 'name': put_course_res, 'enrollment_term_id': course.enrollment_term_id }
                return Response(formatted_course, status=HTTPStatus.OK)
            except CanvasException as e:
                logger.error(f"Canvas API error: {e}")
                err_response: CanvasHTTPError = CANVAS_CREDENTIALS.handle_canvas_api_exception(e, course_id)
                return Response(err_response.to_dict(), status=err_response.status_code)
        else:
            # If validation fails, return the error details.
            return Response(serializer.errors, status=HTTPStatus.BAD_REQUEST)
