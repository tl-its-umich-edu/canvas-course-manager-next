import logging
from http import HTTPStatus
import time
import asyncio
import json
from rest_framework.views import APIView
from rest_framework import authentication, permissions
from rest_framework.response import Response
from rest_framework.request import Request

from canvasapi.exceptions import CanvasException
from canvasapi import Canvas
from canvasapi.section import Section
from canvasapi.user import User
from backend.ccm.canvas_api.enroll_users import enroll_user

from backend.ccm.canvas_api.canvasapi_serializer import CanvasObjectROSerializer, MultiSectionEnrollRequestSerializer, SingleSectionEnrollRequestSerializer

from .exceptions import CanvasErrorHandler, HTTPAPIError
from canvas_oauth.exceptions import InvalidOAuthReturnError

from backend.ccm.canvas_api.canvas_credential_manager import CanvasCredentialManager

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
    
        

class SingleSectionEnrollmentView(LoggingMixin, APIView):

    authentication_classes = [authentication.SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SingleSectionEnrollRequestSerializer  # Ensures Swagger UI recognizes it

    def __init__(self, credential_manager=None):
        self.credential_manager = credential_manager or CanvasCredentialManager()
        self.canvas_error = CanvasErrorHandler()
        super().__init__()

    async def enroll_user_async(self, canvas_api, section_id, login_id, role):
        # Wrap the sync function in a coroutine for compatibility
        return enroll_user(canvas_api, section_id, login_id, role)

    async def gather_enrollments(self, users, canvas_api, section_id):
        tasks = [
            self.enroll_user_async(canvas_api, section_id, user.get('loginId'), user.get('role').lower())
            for user in users
        ]
        return await asyncio.gather(*tasks, return_exceptions=True)

    @extend_schema(
        operation_id="single_section_enrollment",
        summary="Enroll users in a single section",
        description="Enroll one or more users in a specific Canvas section by section ID.",
        request=SingleSectionEnrollRequestSerializer,
        parameters=[
            OpenApiParameter(
                name="section_id",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                required=True,
                description="Section ID to enroll users into."
            )
        ],
    )
    def post(self, request: Request, section_id=None) -> Response:
        logger.info(f"POST /api/sections/{section_id}/enroll/ called.")
        logger.info(f"Received data: {json.dumps(request.data)}")
        serializer: SingleSectionEnrollRequestSerializer = SingleSectionEnrollRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            self.canvas_error.handle_serializer_errors(serializer.errors, str(request.data))
            error_response = self.canvas_error.to_dict()
            return Response(error_response, status=error_response.get('statusCode'))
        
        # --- Custom enrollment logic using SIS login id ---
        try:
            canvas_api: Canvas = self.credential_manager.get_canvasapi_instance(request)
            enrollment_params = serializer.validated_data.get('users', {})
            logger.info(f"Enrolling users in section {section_id} with params: {enrollment_params}")

            loop_start_time = time.perf_counter()
            results = asyncio.run(self.gather_enrollments(enrollment_params, canvas_api, section_id))
            for user, enrollment in zip(enrollment_params, results):
                login_id = user.get('loginId')
                if isinstance(enrollment, Exception):
                    logger.error(f"Enrollment failed for {login_id}: {enrollment}")
                else:
                    logger.info(f"Enrollment response for {login_id}: {enrollment}")

            loop_elapsed = time.perf_counter() - loop_start_time

            if loop_elapsed >= 60:
                minutes = loop_elapsed // 60
                seconds = loop_elapsed % 60
                logger.info(f"Total time taken to enroll all users: {int(minutes)} min {seconds:.1f} sec")
            else:
                logger.info(f"Total time taken to enroll all users: {loop_elapsed:.3f} seconds")

            return Response({}, status=HTTPStatus.OK)
        except Exception as e:
            logger.error(f"Error enrolling users in section {section_id}: {e}")
            self.canvas_error.handle_canvas_api_exceptions([HTTPAPIError(str(section_id), e)])
            error_response = self.canvas_error.to_dict()
            return Response(error_response, status=error_response.get('statusCode'))
        # --- End custom logic ---

class MultiSectionEnrollmentView(LoggingMixin, APIView):
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
    def post(self, request: Request) -> Response:
        import json
        logger.info("POST /api/sections/enroll/ called.")
        logger.info(f"Received data: {json.dumps(request.data)}")
        serializer: MultiSectionEnrollRequestSerializer = MultiSectionEnrollRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            self.canvas_error.handle_serializer_errors(serializer.errors, str(request.data))
            error_response = self.canvas_error.to_dict()
            return Response(error_response, status=error_response.get('statusCode'))
        
        return Response({
            "endpoint": "/api/sections/enroll/",
            "received": request.data
        }, status=HTTPStatus.OK)


