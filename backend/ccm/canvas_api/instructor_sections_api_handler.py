import logging, asyncio
from http import HTTPStatus
from canvasapi import Canvas
from rest_framework.views import APIView
from rest_framework import authentication, permissions
from rest_framework_tracking.mixins import LoggingMixin
from rest_framework.response import Response
from rest_framework.request import Request
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from canvasapi.exceptions import CanvasException
from canvasapi.course import Course
from asgiref.sync import async_to_sync
from backend.ccm.canvas_api.constants import MAX_CONCURRENCY

from backend.ccm.canvas_api.canvas_credential_manager import CanvasCredentialManager
from backend.ccm.canvas_api.canvasapi_serializer import CanvasObjectROSerializer, InstructorSectionsQuerySerializer
from backend.ccm.canvas_api.exceptions import CanvasErrorHandler, HTTPAPIError
from backend.ccm.utils import timeit

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
    serializer_class = InstructorSectionsQuerySerializer

    def __init__(self, credential_manager=None):
        self.credential_manager = credential_manager or CanvasCredentialManager()
        self.canvas_error = CanvasErrorHandler()
        super().__init__()
    
    @extend_schema(
        operation_id="get_instructor_sections",
        summary="Get sections for instructor's courses",
        description="Retrieve mergeable sections for all courses taught by the instructor user, filtered by term ID.",
        parameters=[
            OpenApiParameter(
                name="term_id",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=True,
                description="Canvas term ID to filter courses."
            ),
        ]
    )
    def get(self, request: Request) -> Response:
        serializer = InstructorSectionsQuerySerializer(data=request.query_params)
        if not serializer.is_valid():
            self.canvas_error.handle_serializer_errors(serializer.errors, f"{request.query_params}")
            return Response(serializer.errors, status=self.canvas_error.to_dict().get('statusCode'))
        term_id = serializer.validated_data.get('term_id')

        canvas_api = self.credential_manager.get_canvasapi_instance(request)
        try:
            filtered_courses, course_instance_map = self._get_filtered_teacher_courses(canvas_api, term_id)
            success,response_data = self._attach_sections_to_courses(filtered_courses, course_instance_map)
            
            if not success: # Errors occurred during section fetching
                self.canvas_error.handle_canvas_api_exceptions(response_data)
                return Response(self.canvas_error.to_dict(), status=self.canvas_error.to_dict().get('statusCode'))
            else:
                return Response(response_data, status=HTTPStatus.OK)
        except (HTTPAPIError) as e:
            self.canvas_error.handle_canvas_api_exceptions(e)
            logger.error(f"Error retrieving instructor sections for user id {request.user.id}")
            return Response(self.canvas_error.to_dict(), status=self.canvas_error.to_dict().get('statusCode'))

    def _get_filtered_teacher_courses(self, canvas_api: Canvas, term_id: str) -> tuple[list[dict], dict[int, Course]]:
        """Fetch and filter teacher courses by term_id and a map of the course instances. Returns (filtered_courses, course_instance_map)."""
        logger.info(f"Retrieving instructor courses for term_id: {term_id}")
        try:
            courses = canvas_api.get_courses(enrollment_type='teacher')
            course_instance_map: dict[int, Course] = {course.id: course for course in list(courses)}
            serializer = CanvasObjectROSerializer(courses, allowed_fields=self.courses_allowed_fields, many=True)
            filtered_courses: list[dict] = [course for course in serializer.data if course.get('enrollment_term_id') == int(term_id)]
            logger.info(f"Filtered to {len(filtered_courses)} courses for term_id {term_id}")
            return filtered_courses, course_instance_map
        except (CanvasException, Exception) as e:
            failed_input = f"term_id {term_id}"
            raise HTTPAPIError(failed_input, e)

    @async_to_sync
    async def _attach_sections_to_courses(self, courses_data:list[dict] , course_instance_map:dict[int, Course]) -> tuple[bool, list[dict] | list[HTTPAPIError]]:
        """ Attach sections to each course in courses_data, guarded by a semaphore for concurrency control."""
        max_concurrent = MAX_CONCURRENCY 
        semaphore = asyncio.Semaphore(max_concurrent)
        errors = []
        tasks = [self._attach_section_semaphore_task(
            semaphore,
            errors,
            course, 
            course_instance_map.get(course.get('id'))
        ) for course in courses_data]
        await asyncio.gather(*tasks, return_exceptions=True)
        
        success = len(errors) == 0 # boolean to indicate if errors occurred
        return success, courses_data if success else errors
    
    async def _attach_section_semaphore_task(self, semaphore: asyncio.Semaphore, errors:list, course: dict, course_instance: Course):
        """ For a given course, fetch and attach sections using a semaphore to limit concurrency. """
        async with semaphore:
            try:
                return await asyncio.to_thread(self._attach_section_sync, course, course_instance)
            except Exception as e:
                errors.append(e if isinstance(e, HTTPAPIError) else HTTPAPIError(f"course id {course.get('id')}", e))
    
    def _attach_section_sync(self, course: dict, course_instance: Course):
        """ Synchronous helper to fetch and attach sections to a course. """
        try:
            sections = course_instance.get_sections(include=['total_students'], per_page=100)
            section_serializer = CanvasObjectROSerializer(sections, allowed_fields=self.sections_allowed_fields, many=True)
            course['sections'] = section_serializer.data
            logger.info(f"Attached {len(course['sections'])} sections to course_id {course.get('id')}")
        except (CanvasException, Exception) as e:
            failed_input = f"course id {course.get('id')}"
            raise HTTPAPIError(failed_input, e)