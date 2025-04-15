import logging
from http import HTTPStatus
from rest_framework.views import APIView
from rest_framework import authentication, permissions
from rest_framework.response import Response
from rest_framework.request import Request

from canvasapi.exceptions import CanvasException
from canvasapi import Canvas

from backend.ccm.canvas_api.canvasapi_serializer import CanvasObjectROSerializer

from .exceptions import CanvasHTTPError
from canvas_oauth.exceptions import InvalidOAuthReturnError

from backend.ccm.canvas_api.canvas_credential_manager import CanvasCredentialManager

from drf_spectacular.utils import extend_schema

from rest_framework_tracking.mixins import LoggingMixin

logger = logging.getLogger(__name__)

class CanvasSectionEnrollmentAPIHandler(LoggingMixin, APIView):
    logging_methods = ['GET']
    """
    API handler for Canvas section enrollment data.
    """
    authentication_classes = [authentication.SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def __init__(self, credential_manager=None):
        self.credential_manager = credential_manager or CanvasCredentialManager()
        super().__init__()

    def get(self, request: Request, section_id: int) -> Response:
        """
        Get section enrollment data from canvas by section_id.
        """
        try:
            canvas_api: Canvas = self.credential_manager.get_canvasapi_instance(request)
            logger.info(f"Retrieving section enrollment data with section_id: {section_id}")
            section = canvas_api.get_section(section_id)
            # Get list of enrollments, filtered to only user info
            enrollments = section.get_enrollments(include=['user'], per_page=100)
            logger.info(f"Enrollment data retrieved: {list(enrollments)}")
            allowed_fields = {"user"}
            logger.info(f"Filtering enrollment data with allowed fields: {allowed_fields}")
            serializer = CanvasObjectROSerializer(enrollments,allowed_fields=allowed_fields, many=True)
            logger.info(f"Filtered enrollment data: {serializer.data}")
            login_ids = [enrollment['user']['login_id'] for enrollment in serializer.data]
            logger.info(f"Filtered enrollment data: {login_ids}")
            return Response(login_ids, status=HTTPStatus.OK)
        except (CanvasException, InvalidOAuthReturnError, Exception) as e:
            err_response: CanvasHTTPError = self.credential_manager.handle_canvas_api_exception(e, request, str(section_id))
            return Response(err_response.to_dict(), status=err_response.status_code)

