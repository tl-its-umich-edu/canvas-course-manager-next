import logging
from http import HTTPStatus
import time
from rest_framework.views import APIView
from rest_framework import authentication, permissions
from rest_framework.response import Response
from rest_framework.request import Request

from canvasapi.exceptions import CanvasException
from canvasapi import Canvas

from backend.ccm.canvas_api.canvasapi_serializer import CanvasObjectROSerializer

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
                # Get section details
                section = canvas_api.get_section(section_id)
            except (CanvasException, InvalidOAuthReturnError, Exception) as e:
                self.canvas_error.handle_canvas_api_exceptions(HTTPAPIError(str(section_ids), e))
                return Response(self.canvas_error.to_dict(), status=self.canvas_error.to_dict().get('statusCode'))
            
            try:
                enrollments = section.get_enrollments(include=['user'], per_page=100)
            except (CanvasException, InvalidOAuthReturnError, Exception) as e:
                api_errors.append(HTTPAPIError(str(section_id), e))
                logger.error(f"Error retrieving enrollments for section_id {section_id}: {e}")
                continue

            # Add login IDs to the set
            for enrollment in enrollments:
                unique_login_ids.add(enrollment.user['login_id'])
            logger.debug(f"Retrieved section and enrollments with section_id: {section_id}")
        
        time_end = time.perf_counter()
        logger.info(f"Time taken to get enrollments: {time_end - time_start:.2f} seconds")
        if api_errors:
            self.canvas_error.handle_canvas_api_exceptions(api_errors)
            return Response(self.canvas_error.to_dict(), status=self.canvas_error.to_dict().get('statusCode'))
        else:
            return Response(list(unique_login_ids), status=HTTPStatus.OK)
        

