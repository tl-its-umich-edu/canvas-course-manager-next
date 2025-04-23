import logging, asyncio, time
from http import HTTPStatus
from backend.ccm.canvas_api.canvasapi_serializer import CanvasObjectROSerializer, CourseSectionSerializer
from rest_framework.views import APIView
from rest_framework import authentication, permissions
from rest_framework.response import Response
from rest_framework.request import Request

from canvasapi.exceptions import CanvasException
from canvasapi import Canvas
from canvasapi.course import Course
from drf_spectacular.utils import extend_schema

from .exceptions import CanvasErrorHandler, HTTPAPIError

from backend.ccm.canvas_api.canvas_credential_manager import CanvasCredentialManager

from rest_framework_tracking.mixins import LoggingMixin

logger = logging.getLogger(__name__)

class CanvasCourseSectionAPIHandler(LoggingMixin, APIView):
    """
    "API handler for Canvas section data."
    """
    logging_methods = ['GET', 'POST']
    authentication_classes = [authentication.SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    course_section_allowed_fields = {"course_id", "id", "name", "nonxlist_course_id", "total_students"}
    serializer_class = CourseSectionSerializer  # Ensures Swagger UI recognizes it

    def __init__(self, credential_manager=None):
        self.credential_manager = credential_manager or CanvasCredentialManager()
        self.canvas_error = CanvasErrorHandler()
        super().__init__()

    def get(self, request: Request, course_id: int, per_page: int = 100) -> Response:
        """
        Get section data from Canvas.
        """
        canvas_api: Canvas = self.credential_manager.get_canvasapi_instance(request)
            
            # Call the Canvas API package to get section details.
        try:
            logger.info(f"Retrieving course for section data with course_id: {course_id}")
            # Get list of sections, including total_students info
            sections = canvas_api.get_course(course_id).get_sections(include=['total_students'], per_page=per_page)
            
            serializer = CanvasObjectROSerializer(sections, allowed_fields=self.course_section_allowed_fields, many=True)
            logger.info(f"Section data retrieved with filtered fields: {self.course_section_allowed_fields}")
            logger.debug(f"Section data in response: {serializer.data}")

            return Response(serializer.data, status=HTTPStatus.OK)
        except (CanvasException, Exception) as e:
            self.canvas_error.handle_canvas_api_exceptions(HTTPAPIError(str(course_id), e))
            return Response(self.canvas_error.to_dict(), status=self.canvas_error.to_dict().get('statusCode'))
    
    @extend_schema(
        operation_id="create_course_sections",
        summary="create Course sections",
        description="This handle course sections creation upto 60 sections.",
        request=CourseSectionSerializer,
    )
    def post(self, request: Request, course_id: int) -> Response:
        serializer: CourseSectionSerializer = CourseSectionSerializer(data=request.data)
        if not serializer.is_valid():
            self.canvas_error.handle_serializer_errors(serializer.errors, str(request.data))
            return Response(self.canvas_error.to_dict(), status=self.canvas_error.to_dict().get('statusCode'))
        
        sections: list = serializer.validated_data['sections']
        logger.info(f"Creating {sections} sections for course_id: {course_id}")
        canvas_api: Canvas = self.credential_manager.get_canvasapi_instance(request)
        try:
            # Check if the course exists
            course: Course = canvas_api.get_course(course_id)
        except CanvasException as e:
            self.canvas_error.handle_canvas_api_exceptions(HTTPAPIError(str(course_id), e))
            return Response(self.canvas_error.to_dict(), status=self.canvas_error.to_dict().get('statusCode'))
           
        start_time: float = time.perf_counter()
        results = asyncio.run(self.create_sections(course, sections))
        end_time: float = time.perf_counter()
        logger.info(f"Time taken to create {len(sections)} sections: {end_time - start_time:.2f} seconds")

        # Filter success and error responses
        success_res = [result for result in results if isinstance(result, dict)]
        err_res = [res for res in results if isinstance(res, HTTPAPIError)]

        logger.info(f"{len(success_res)}/{len(sections)} sections successfully created")
        logger.debug(f"Errors while creating the section: {err_res}")
        
        if not err_res:
            return Response(success_res, status=HTTPStatus.CREATED)
        
        # Handle errors
        self.canvas_error.handle_canvas_api_exceptions(err_res)
        return Response(self.canvas_error.to_dict(), status=self.canvas_error.to_dict().get('statusCode'))
        
    async def create_sections(self, course: Course, section_names: list):
        """Creates multiple sections concurrently."""
        tasks = [self.create_section(course, name) for name in section_names]
        return await asyncio.gather(*tasks, return_exceptions=True)

    def create_section_sync(self, course: Course, section_name: str):
        """Creates a section synchronously with automatic retry handling."""
        try:
            logger.info(f"Creating section: {section_name} for course_id: {course.id} at {time.strftime('%H:%M:%S')}")
            section = course.create_course_section(course_section={"name": section_name})
            
            # Serialize the section and add total_students manually
            append_fields = {"total_students": 0}  # Default value for total_students
            serializer = CanvasObjectROSerializer(section, allowed_fields=self.course_section_allowed_fields, append_fields=append_fields)
            serialized_data = serializer.data
            return serialized_data
        
        except (CanvasException, Exception) as e:
            raise HTTPAPIError(section_name, e)

    async def create_section(self, course: Course, section_name: str):
        """Async wrapper to call create_section_sync using asyncio.to_thread()."""
        try:
            return await asyncio.to_thread(self.create_section_sync, course, section_name)
        except Exception as e:
            return e if isinstance(e, HTTPAPIError) else HTTPAPIError(section_name, e)
