import logging
from django.conf import settings
from canvas_oauth.oauth import get_oauth_token
from rest_framework.request import Request
from canvas_oauth.exceptions import InvalidOAuthReturnError

from canvasapi import Canvas
from .exceptions import CanvasAccessTokenException 

logger = logging.getLogger(__name__)

class CanvasCredentialManager:

  def __init__(self):
    super().__init__()
    self.canvasURL = f"https://{settings.CANVAS_OAUTH_CANVAS_DOMAIN}"
  
  def get_canvasapi_instance(self, request: Request) -> Canvas:
    try:
      access_token = get_oauth_token(request)
    except InvalidOAuthReturnError as e:
      # This issue occurred during non-prod Canvas sync when the API key was deleted, but the token remained in CCM databases. Expired token will trigger the usecase.
      logger.error(f"InvalidOAuthReturnError for user: {request.user}. Remove invalid refresh_token and prompt for reauthentication.")
      raise CanvasAccessTokenException()
    return Canvas(self.canvasURL, access_token)
  
  