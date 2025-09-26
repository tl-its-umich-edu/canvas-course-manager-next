import logging
from http import HTTPStatus
from rest_framework.views import APIView
from rest_framework_tracking.mixins import LoggingMixin
from rest_framework import authentication, permissions
from rest_framework.request import Request
from rest_framework.response import Response
from canvasapi import Canvas
from canvasapi.exceptions import CanvasException
from backend.ccm.canvas_api.canvas_credential_manager import CanvasCredentialManager
from backend.ccm.canvas_api.canvasapi_serializer import CanvasObjectROSerializer, LoginIdSerializer
from .exceptions import CanvasErrorHandler, HTTPAPIError

logger = logging.getLogger(__name__)

class CanvasUserHandler(LoggingMixin, APIView):
    logging_methods = ['GET']
    authentication_classes = [authentication.SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    user_allowed_fields = ['name']   
    serializer_class = LoginIdSerializer

    def __init__(self, credential_manager=None):
        self.credential_manager = credential_manager or CanvasCredentialManager()
        self.canvas_error = CanvasErrorHandler()
        super().__init__()
    
    def get(self, request: Request, login_id: str) -> Response:
        # Validate login_id is an email address
        serializer = LoginIdSerializer(data={'login_id': login_id})
        if not serializer.is_valid():
            self.canvas_error.handle_serializer_errors(serializer.errors,str(login_id))
            return Response(self.canvas_error.to_dict(), status=self.canvas_error.to_dict().get('statusCode'))
        
        canvas_admin_api: Canvas = self.credential_manager.get_canvasapi_admin_instance()
        safe_login_id: str = login_id.replace('@', '+')
        try:
            user_info = canvas_admin_api.get_user(safe_login_id, 'sis_login_id')
            append_fields ={"login_id": login_id}
            serializer = CanvasObjectROSerializer(user_info, allowed_fields=self.user_allowed_fields, append_fields=append_fields)
            return Response(serializer.data, status=HTTPStatus.OK)
        except (CanvasException, Exception) as e:
            self.canvas_error.handle_canvas_api_exceptions(HTTPAPIError(str(login_id), e), True)
            return Response(self.canvas_error.to_dict(), status=self.canvas_error.to_dict().get('statusCode'))
      

