import logging
from http import HTTPStatus
import time
from datetime import datetime
from django.urls import reverse
from rest_framework.views import APIView
from rest_framework import authentication, permissions
from rest_framework.response import Response
from rest_framework.request import Request
from django_q.tasks import async_task

from canvasapi.exceptions import CanvasException
from canvasapi import Canvas
from canvasapi.section import Section

from backend.ccm.canvas_api.canvasapi_serializer import CanvasObjectROSerializer, MultiSectionEnrollRequestSerializer, SingleSectionEnrollRequestSerializer
from backend.ccm.canvas_api.constants import MAX_CONCURRENCY

from .exceptions import CanvasErrorHandler, HTTPAPIError
from backend.ccm.utils import timeit

from backend.ccm.canvas_api.canvas_credential_manager import CanvasCredentialManager
from backend.ccm.canvas_api.enroll_users import EnrollUsers

from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from rest_framework_tracking.mixins import LoggingMixin

logger = logging.getLogger(__name__)

class CanvasSectionEnrollmentsAPIHandler(LoggingMixin, APIView):
    logging_methods = ['GET']
    """
    API handler for Canvas section enrollment data.
    """
    authentication_classes = [authentication.SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def __init__(self, credential_manager=None):
        self.credential_manager = credential_manager or CanvasCredentialManager()
        self.canvas_error = CanvasErrorHandler()
        super().__init__()

    # Schema needed for swagger UI
    @extend_schema( 
        operation_id="get_section_enrollments",
        summary="Get enrollments for multiple sections",
        description="Retrieve unique login IDs of students enrolled in multiple sections by providing a list of section IDs as a query parameter.",
        parameters=[
            OpenApiParameter(
                name="section_ids",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=True,
                description="Comma-separated list of section IDs (e.g., `12345,54321`)."
            )
        ]
    )
    def get(self, request: Request) -> Response:
        """
        Get section enrollment data from canvas by section_id.
        """
        section_ids_param = request.query_params.get('section_ids')
        time_start = time.perf_counter()
        if not section_ids_param:
            return Response({"error": "Section IDs are required as a parameter"}, status=HTTPStatus.BAD_REQUEST)
        
        canvas_api: Canvas = self.credential_manager.get_canvasapi_instance(request)
        section_ids = [int(section_id) for section_id in section_ids_param.split(',')]
        logger.info("Retrieving section enrollment data with section_ids: %s", section_ids)
        unique_login_ids = set()  # Use a set to store unique login IDs
        api_errors = []
        for section_id in section_ids:
            try:
                requested_section = Section(canvas_api._Canvas__requester, {'id': section_id})
                enrollments = requested_section.get_enrollments(include=['user'], per_page=100)
                allowed_fields = {"user"}
                serializer = CanvasObjectROSerializer(enrollments,allowed_fields=allowed_fields, many=True)
                # Add login IDs to the set
                for enrollment in serializer.data:
                    unique_login_ids.add(enrollment['user']['login_id'])
                logger.debug(f"Retrieved section and enrollments with section_id: {section_id}")
            except (CanvasException, Exception) as e:
                api_errors.append(HTTPAPIError(str(section_id), e))
                logger.error(f"Error retrieving enrollments for section_id {section_id}: {e}")
                continue
        
        time_end = time.perf_counter()
        logger.info(f"Time taken to get enrollments: {time_end - time_start:.2f} seconds")
        
        if api_errors:
            self.canvas_error.handle_canvas_api_exceptions(api_errors)
            error_response = self.canvas_error.to_dict()
            return Response(error_response, status=error_response.get('statusCode'))
    
        return Response(list(unique_login_ids), status=HTTPStatus.OK)

# Mixin for shared enrollment task logic
class EnrollmentTaskMixin:
    def create_enrollment_task(self, request, course_id, enrollment_params, section_id=None, multi_section=False):
        """
        Helper to create async enrollment task and handle errors.
        Returns a Response object.
        """
        timestamp = datetime.now().strftime('%Y/%m/%d-%H:%M:%S-%f')
        if multi_section:
            task_name = f'c{course_id}-multisections-{len(enrollment_params)}-{timestamp}'
        else:
            task_name = f'c{course_id}-s{section_id}-{len(enrollment_params)}-{timestamp}'
        task_payload = {
            'enrollment_params': enrollment_params,
            'course_id': course_id,
            'user_id': request.user.id,
            'canvas_callback_url': request.build_absolute_uri(reverse('canvas-oauth-callback')),
        }
        try:
            task_id = async_task('backend.ccm.background_tasks.enroll_um_users_task.enroll_um_users', task=task_payload, task_name=task_name)
            return Response({"task_id": task_id}, status=HTTPStatus.OK)
        except Exception as e:
            self.canvas_error.django_q_task_error(e, str(request.data))
            error_response = self.canvas_error.to_dict()
            return Response(error_response, status=error_response.get('statusCode'))

class SingleSectionEnrollmentView(EnrollmentTaskMixin, LoggingMixin, APIView):

    authentication_classes = [authentication.SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SingleSectionEnrollRequestSerializer  # Ensures Swagger UI recognizes it

    def __init__(self, credential_manager=None):
        self.credential_manager = credential_manager or CanvasCredentialManager()
        self.canvas_error = CanvasErrorHandler()
        super().__init__()

    @extend_schema(
        operation_id="single_section_enrollment",
        summary="Enroll users in a single section",
        description="Enroll one or more users in a specific Canvas section by section ID.",
        request=SingleSectionEnrollRequestSerializer,
        parameters=[
            OpenApiParameter(
                name="course_id",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                required=True,
                description="Course ID for the section."
            ),
            OpenApiParameter(
                name="section_id",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                required=True,
                description="Section ID to enroll users into."
            )
        ],
    )
    @timeit
    def post(self, request: Request, section_id: int, course_id: int=None) -> Response:
        serializer: SingleSectionEnrollRequestSerializer = SingleSectionEnrollRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            self.canvas_error.handle_serializer_errors(serializer.errors, str(request.data))
            error_response = self.canvas_error.to_dict()
            return Response(error_response, status=error_response.get('statusCode'))
        
        enrollment_params = serializer.validated_data.get('users', {})
        # Add sectionId to each enrollment param for consistency with multi-section API
        for param in enrollment_params:
            param['sectionId'] = section_id
        
        if not course_id:
            logger.info(f"Starting enrollment for create external user enroll flow {len(enrollment_params)} users")
            canvas_api: Canvas = self.credential_manager.get_canvasapi_instance(request)
            enrolluser = EnrollUsers(canvas_api, enrollment_params, concurrency=int(MAX_CONCURRENCY)+2)
            results = enrolluser.gather_enrollments(enrollment_params, canvas_api)
            success_res = [result for result in results if isinstance(result, dict)]
            err_res = [res for res in results if isinstance(res, HTTPAPIError)]
            if not err_res:
                return Response(success_res, status=HTTPStatus.CREATED)
            self.canvas_error.handle_canvas_api_exceptions(err_res)
            return Response(self.canvas_error.to_dict(), status=self.canvas_error.to_dict().get('statusCode'))

        else:
            logger.info(f"Enroll users in course {course_id}, section {section_id}")
            return self.create_enrollment_task(request, course_id, enrollment_params, section_id=section_id, multi_section=False)
    

class MultiSectionEnrollmentView(EnrollmentTaskMixin, LoggingMixin, APIView):
    authentication_classes = [authentication.SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MultiSectionEnrollRequestSerializer  # Ensures Swagger UI recognizes it

    def __init__(self, credential_manager=None):
        self.credential_manager = credential_manager or CanvasCredentialManager()
        self.canvas_error = CanvasErrorHandler()
        super().__init__()

    @extend_schema(
        operation_id="multiple_sections_enrollment",
        summary="Enroll users in multiple sections",
        request=MultiSectionEnrollRequestSerializer,
        description="Enroll users in multiple Canvas sections by providing a list of enrollments, each with a section ID.",
    )
    def post(self, request: Request, course_id: int) -> Response:
        serializer: MultiSectionEnrollRequestSerializer = MultiSectionEnrollRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            self.canvas_error.handle_serializer_errors(serializer.errors, str(request.data))
            error_response = self.canvas_error.to_dict()
            return Response(error_response, status=error_response.get('statusCode'))
        
        enrollment_params = serializer.validated_data.get('enrollments', {})
        return self.create_enrollment_task(request, course_id, enrollment_params, multi_section=True)
