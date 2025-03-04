import logging
from http import HTTPStatus
from django.conf import settings
from canvas_oauth.oauth import get_oauth_token, handle_missing_token
from rest_framework.request import Request
from canvas_oauth.models import CanvasOAuth2Token
from canvas_oauth.exceptions import InvalidOAuthReturnError

from canvasapi import Canvas
from canvasapi.exceptions import (
    BadRequest, CanvasException, Conflict, Forbidden, InvalidAccessToken, RateLimitExceeded,
    ResourceDoesNotExist, Unauthorized, UnprocessableEntity
)
from .exceptions import CanvasHTTPError 

logger = logging.getLogger(__name__)

class CanvasCredentialManager:

  EXCEPTION_STATUS_MAP = {
    BadRequest: HTTPStatus.BAD_REQUEST.value,
    InvalidAccessToken: HTTPStatus.UNAUTHORIZED.value,
    Unauthorized: HTTPStatus.UNAUTHORIZED.value,
    Forbidden: HTTPStatus.FORBIDDEN.value,
    RateLimitExceeded: HTTPStatus.FORBIDDEN.value,
    ResourceDoesNotExist: HTTPStatus.NOT_FOUND.value,
    UnprocessableEntity: HTTPStatus.UNPROCESSABLE_ENTITY.value,
    Conflict: HTTPStatus.CONFLICT.value,
}

  def __init__(self):
    super().__init__()
    self.canvasURL = f"https://{settings.CANVAS_OAUTH_CANVAS_DOMAIN}"
  
  def get_canvasapi_instance(self, request: HTTPStatus) -> Canvas:
    try:
      access_token = get_oauth_token(request)
    except InvalidOAuthReturnError as e:
      logger.error(f"InvalidOAuthReturnError for user: {request.user}. Remove invalid refresh_token and prompt for reauthentication.")
      CanvasOAuth2Token.objects.filter(user=request.user).delete()
      raise InvalidOAuthReturnError(str(e))
    return Canvas(self.canvasURL, access_token)
  
  def handle_canvas_api_exception(self, exception: Exception, request: Request, input: str = None) -> CanvasHTTPError:
    if isinstance(exception, InvalidAccessToken):
        CanvasOAuth2Token.objects.filter(user=request.user).delete()
        logger.error(f"Deleted the Canvas OAuth2 token for user: {request.user} since they might have revoked access.")
    
    for class_key in self.EXCEPTION_STATUS_MAP:
        if isinstance(exception, class_key):
            return CanvasHTTPError(exception.message, self.EXCEPTION_STATUS_MAP[class_key], input)
    return CanvasHTTPError(exception.message, HTTPStatus.INTERNAL_SERVER_ERROR.value, input)
