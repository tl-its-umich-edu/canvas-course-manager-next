import logging
import time
from dataclasses import dataclass
from django.test import RequestFactory
from django.contrib.auth import get_user_model
from typing import List
from canvasapi import Canvas
from backend.ccm.canvas_api.canvas_credential_manager import CanvasCredentialManager
from backend.ccm.canvas_api.enroll_users import enroll_user
from django.contrib.auth.models import User
from rest_framework.request import Request
from canvasapi.exceptions import CanvasException, InvalidAccessToken
from datetime import timedelta
from canvas_oauth.oauth import refresh_oauth_token

logger = logging.getLogger(__name__)
course_manager = CanvasCredentialManager()

@dataclass
class SectionUser:
    loginId: str
    role: str

def enroll_users_sync(task_params):
  logger.info(f"Enrolling users in sync approach: {task_params}")

  enrollment_params: List[SectionUser] = [SectionUser(**item) for item in task_params.get('enrollment_params', [])]
  section_id: str = task_params.get('section_id')
  user: int = task_params.get('user_id')
  canvas_callback_url: str = task_params.get('canvas_callback_url')
  # Get the user model and retrieve the user instance and Canvas Token
  user: User = get_user_model().objects.get(pk=user)

  factory = RequestFactory()
  request: Request = factory.get('/oauth/oauth-callback')
  request.user = user

  request.build_absolute_uri = lambda path: canvas_callback_url
  canvas_api: Canvas = course_manager.get_canvasapi_instance(request)
  logger.info(f"Using Canvas API instance for user: {canvas_api}")

  loop_start_time = time.perf_counter()


  for user_param in enrollment_params:
      login_id = user_param.loginId
      role = user_param.role.lower()
      for attempt in range(2):  # Try at most twice: original + after refresh
          try:
              response = enroll_user(canvas_api, section_id, login_id, role)
              logger.info(f"Enrolling response for user {login_id}: {response}")
              break  # Success, move to next user
          except CanvasException as e:
              # Check if this CanvasException is actually an InvalidAccessToken
              if isinstance(e, InvalidAccessToken):
                  if attempt == 0:
                      logger.warning("Access token expired, refreshing token...")
                      refresh_oauth_token(request)
                      canvas_api = course_manager.get_canvasapi_instance(request)  
                      logger.info(f"Refreshed Canvas API instance for user: {canvas_api}")
                  else:
                      logger.error(f"Enrollment failed for {login_id}: Invalid access token after refresh.")
              else:
                  logger.error(f"Enrollment failed for {login_id}: {e}")
                  break
          except Exception as e:
              logger.error(f"Enrollment failed for {login_id}: {e}")
              break
  
  loop_elapsed = time.perf_counter() - loop_start_time
  elapsed = timedelta(seconds=loop_elapsed)
  logger.info(f"Total time taken to enroll all users: {elapsed}")
