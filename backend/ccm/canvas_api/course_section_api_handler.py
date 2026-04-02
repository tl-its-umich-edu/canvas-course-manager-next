import logging, asyncio, time
from http import HTTPStatus
from backend.ccm.canvas_api.canvasapi_serializer import CanvasObjectROSerializer, CourseSectionSerializer, CrosslistSectionsSerializer
from rest_framework.views import APIView
from rest_framework import authentication, permissions
from rest_framework.response import Response
from rest_framework.request import Request

from canvasapi.exceptions import CanvasException
from canvasapi import Canvas
from canvasapi.course import Course
from canvasapi.section import Section
from drf_spectacular.utils import extend_schema
from asgiref.sync import async_to_sync
from backend.ccm.canvas_api.constants import MAX_CONCURRENCY

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
    
    base_course_section_allwed_fields = {"course_id", "id", "name", "nonxlist_course_id"}
    course_section_allowed_fields = base_course_section_allwed_fields.union({"total_students"})
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
            logger.info(f"Retrieving sections for course_id: {course_id}")
            # Create a course object with just the ID to avoid unnecessary API call
            # Skips the get_course() call and directly uses get_sections()
            course = Course(canvas_api._Canvas__requester, {'id': course_id})
            # Get list of sections, including total_students info
            sections = course.get_sections(include=['total_students'], per_page=per_page)
            
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
        
        # Create a Course object with just the ID to avoid unnecessary API call
        # If the course doesn't exist, the section creation will fail with proper error
        course = Course(canvas_api._Canvas__requester, {'id': course_id})
           
        start_time: float = time.perf_counter()
        results = self.create_sections(course, sections)
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

    async def sem_task(self, semaphore, course, name):
        async with semaphore:
            return await self.create_section(course, name)

    @async_to_sync
    async def create_sections(self, course: Course, section_names: list):
        """Creates multiple sections concurrently, guarded by a semaphore."""
        max_concurrent = MAX_CONCURRENCY  # Set your desired concurrency limit here
        semaphore = asyncio.Semaphore(max_concurrent)
        tasks = [self.sem_task(semaphore, course, name) for name in section_names]
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

@extend_schema(
        operation_id="merge_course_sections",
        summary="Merge sections into a course",
        description="Merge sections into a specified course by providing a list of section IDs",
        request=CrosslistSectionsSerializer,
)
class CanvasMergeSectionsToCourseView(LoggingMixin, APIView):
    """
    API handler to merge external sections to a course.
    """
    logging_methods = ['POST']
    authentication_classes = [authentication.SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CrosslistSectionsSerializer # Ensures Swagger UI recognizes it

    def __init__(self, credential_manager=None):
        self.credential_manager = credential_manager or CanvasCredentialManager()
        self.canvas_error = CanvasErrorHandler()
        super().__init__()
    
    def post(self, request: Request, course_id: int) -> Response:
        """
        handle request to merge sections to a course, takes list of section ids
        """
        serializer: CrosslistSectionsSerializer = CrosslistSectionsSerializer(data=request.data)
        if not serializer.is_valid():
            self.canvas_error.handle_serializer_errors(serializer.errors, str(request.data))
            return Response(self.canvas_error.to_dict(), status=self.canvas_error.to_dict().get('statusCode'))
        
        section_ids: list[int] = serializer.validated_data['sectionIds']
        logger.info(f"Merging {len(section_ids)} sections into course_id: {course_id}")
        canvas_api: Canvas = self.credential_manager.get_canvasapi_instance(request)

        try:
            merge_success, merge_response = self._merge_sections(canvas_api, course_id, section_ids)

            if not merge_success:
                self.canvas_error.handle_canvas_api_exceptions(merge_response)
                return Response(self.canvas_error.to_dict(), status=self.canvas_error.to_dict().get('statusCode'))
            logger.info(f"Successfully merged {len(section_ids)} sections into course_id: {course_id}")

            serializer = CanvasObjectROSerializer(merge_response, allowed_fields=CanvasCourseSectionAPIHandler.base_course_section_allwed_fields, many=True)
            return Response(serializer.data, status=HTTPStatus.OK)
        
        except (HTTPAPIError) as e:
            self.canvas_error.handle_canvas_api_exceptions(e)
            logger.error(f"Error merging sections into course_id {course_id}: {e}")
            return Response(self.canvas_error.to_dict(), status=self.canvas_error.to_dict().get('statusCode'))
    
    @async_to_sync
    async def _merge_sections(self, canvas_api: Canvas, course_id: int, section_ids: list[int]):
        """
        Merge sections to a course via the Canvas crosslist endpoint.

        Uses a semaphore for bounded concurrency. If any task fails, returned
        errors are collected in task-completion order, which is non-deterministic.
        Returns a tuple of (success, results_or_errors).
        """
        max_concurrent = MAX_CONCURRENCY 
        semaphore = asyncio.Semaphore(max_concurrent)
        errors = []
        tasks = [api_task_with_semaphore(
            semaphore,
            errors,
            self._merge_section_sync,
            canvas_api,
            section_id,
            course_id
        ) for section_id in section_ids]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        success = len(errors) == 0
        return success, results if success else errors
    
    def _merge_section_sync(self,canvas_api: Canvas, section_id:int, course_id: int):
        """
        Synchronous function to merge a single section to a course.
        """
        try:
            logger.debug(f"Merging section: {section_id} into course_id: {course_id}")
            section = Section(canvas_api._Canvas__requester, {'id': section_id})
            merged_section = section.cross_list_section(course_id)
            logger.debug(f"Successfully merged section: {merged_section}")
            return merged_section
        except (CanvasException, Exception) as e:
            failed_input = f"section_id {section_id} to course_id {course_id}"
            raise HTTPAPIError(failed_input, e)
        
class CanvasUnmergeSectionsView(LoggingMixin, APIView):
    """
    API handler to unmerge sections from a course.
    """
    logging_methods = ['DELETE']
    authentication_classes = [authentication.SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CrosslistSectionsSerializer # Ensures Swagger UI recognizes it

    def __init__(self, credential_manager=None):
        self.credential_manager = credential_manager or CanvasCredentialManager()
        self.canvas_error = CanvasErrorHandler()
        super().__init__()

    def delete(self, request: Request) -> Response:
        """
        handle request to unmerge sections from their current course, takes list of section ids
        """
        serializer: CrosslistSectionsSerializer = CrosslistSectionsSerializer(data=request.data)
        if not serializer.is_valid():
            self.canvas_error.handle_serializer_errors(serializer.errors, str(request.data))
            return Response(self.canvas_error.to_dict(), status=self.canvas_error.to_dict().get('statusCode'))
        
        section_ids: list[int] = serializer.validated_data['sectionIds']
        logger.info(f"Unmerging {len(section_ids)} section(s)")
        canvas_api: Canvas = self.credential_manager.get_canvasapi_instance(request)

        try:
            unmerge_success, unmerge_response = self._unmerge_sections(canvas_api, section_ids)

            if not unmerge_success:
                self.canvas_error.handle_canvas_api_exceptions(unmerge_response)
                return Response(self.canvas_error.to_dict(), status=self.canvas_error.to_dict().get('statusCode'))
            logger.info(f"Successfully unmerged {len(section_ids)} section(s)")

            serializer = CanvasObjectROSerializer(unmerge_response, allowed_fields=CanvasCourseSectionAPIHandler.base_course_section_allwed_fields, many=True)
            return Response(serializer.data, status=HTTPStatus.OK)
        except (HTTPAPIError) as e:
            self.canvas_error.handle_canvas_api_exceptions(e)
            logger.error(f"Error unmerging section(s): {e}")
            return Response(self.canvas_error.to_dict(), status=self.canvas_error.to_dict().get('statusCode'))
        
    @async_to_sync
    async def _unmerge_sections(self, canvas_api: Canvas, section_ids: list[int]):
        """
        Unmerge sections via the Canvas un-crosslist endpoint.

        Uses a semaphore for bounded concurrency. If any task fails, returned
        errors are collected in task-completion order, which is non-deterministic.
        Returns a tuple of (success, results_or_errors).
        """
        max_concurrent = MAX_CONCURRENCY 
        semaphore = asyncio.Semaphore(max_concurrent)
        errors = []
        tasks = [api_task_with_semaphore(
            semaphore,
            errors,
            self._unmerge_section_sync,
            canvas_api,
            section_id
        ) for section_id in section_ids]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        success = len(errors) == 0
        return success, results if success else errors
    
    def _unmerge_section_sync(self,canvas_api: Canvas, section_id:int):
        """
        Synchronous function to unmerge a single section from its current course.
        """
        try:
            logger.debug(f"Unmerging section: {section_id}")
            section = Section(canvas_api._Canvas__requester, {'id': section_id})
            unmerged_section = section.decross_list_section()
            logger.debug(f"Successfully unmerged section: {unmerged_section}")
            return unmerged_section
        except (CanvasException, Exception) as e:
            failed_input = f"section_id {section_id}"
            raise HTTPAPIError(failed_input, e)
    
async def api_task_with_semaphore(
    semaphore: asyncio.Semaphore, 
    errors: list, 
    sync_func: callable, 
    *args, 
    **kwargs):
    """ 
    Run a synchronous function within a semaphore to limit concurrency,
    capturing errors in a separate list.
    """
    async with semaphore:
        try:
            return await asyncio.to_thread(sync_func, *args, **kwargs)
        except Exception as e:
            errors.append(e if isinstance(e, HTTPAPIError) else HTTPAPIError(str(args), e))