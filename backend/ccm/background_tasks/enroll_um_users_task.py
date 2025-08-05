import logging
import time
import asyncio
from dataclasses import dataclass
from django.test import RequestFactory
from django.contrib.auth import get_user_model
from typing import List
from canvasapi import Canvas
from canvasapi.exceptions import Unauthorized
from backend.ccm.canvas_api.canvas_credential_manager import CanvasCredentialManager

from backend.ccm.canvas_api.enroll_users import enroll_user
from backend.ccm.canvas_api.constants import INSUFFICIENT_SCOPES_ON_ACCESS_TOKEN
from django.contrib.auth.models import User
from rest_framework.request import Request
from asgiref.sync import async_to_sync
from datetime import timedelta
from canvas_oauth.models import CanvasOAuth2Token

logger = logging.getLogger(__name__)
course_manager = CanvasCredentialManager()

@dataclass
class EnrollmentUser:
    loginId: str
    role: str
    sectionId: int

async def enroll_user_async(canvas_api, section_id, login_id, role):
      # Wrap the sync function in a coroutine for compatibility
      return await asyncio.to_thread(enroll_user, canvas_api, section_id, login_id, role)

async def sem_task(semaphore, canvas_api, enrollment_user: EnrollmentUser):
    async with semaphore:
        return await enroll_user_async(canvas_api, enrollment_user.sectionId, enrollment_user.loginId.lower(), enrollment_user.role.lower())

@async_to_sync()
async def gather_enrollments(enrollment_users, canvas_api):
    max_concurrent = 10
    semaphore = asyncio.Semaphore(max_concurrent)
    tasks = [sem_task(semaphore, canvas_api, user) for user in enrollment_users]
    return await asyncio.gather(*tasks, return_exceptions=True)

def enroll_um_users(task):
  logger.info(f"Enrolling users in section with task data: {task}")

  enrollment_params: List[EnrollmentUser] = [EnrollmentUser(**item) for item in task.get('enrollment_params', [])]
  req_user_id: int = task.get('user_id')
  course_id: int = task.get('course_id')
  canvas_callback_url: str = task.get('canvas_callback_url')
  # Get the user model and retrieve the user instance and Canvas Token
  req_user: User = get_user_model().objects.get(pk=req_user_id)
  req_user_email = req_user.email.lower()  # Ensure email is lowercase for consistency

  # Create a request factory and build the request since this is a background task request won't have a user session
  factory = RequestFactory()
  request: Request = factory.get('/oauth/oauth-callback')
  request.user = req_user
  request.build_absolute_uri = lambda path: canvas_callback_url
  canvas_api: Canvas = course_manager.get_canvasapi_instance(request)

  loop_start_time = time.perf_counter()
  logger.info(f"Starting enrollment for {len(enrollment_params)} users")

  results = gather_enrollments(enrollment_params, canvas_api)

  failed_enrollments = []
  unauthorized_scope_found = False
  # asyncio gather preserves the order of enrollment_params, so we can match them with results
  for enroll_user, enrollment in zip(enrollment_params, results):
      if isinstance(enrollment, Exception):
          failed_enrollments.append({
              'sectionId': enroll_user.sectionId,
              'loginId': enroll_user.loginId,
              'role': enroll_user.role,
              'error': str(enrollment)
          })
          # Check for Unauthorized with insufficient scopes
          if (
              isinstance(enrollment, Unauthorized) and
              INSUFFICIENT_SCOPES_ON_ACCESS_TOKEN in str(enrollment).lower()
          ):
              unauthorized_scope_found = True

  if unauthorized_scope_found:
      # This might happen when new scopes are added after the token was issued, but not going to be an issue with Prod release 
      logger.warning(f"Deleting CanvasOAuth2Token for user {request.user.username} due to insufficient scopes on access token.")
      CanvasOAuth2Token.objects.filter(user=request.user).delete()

  if failed_enrollments:
      for fail in failed_enrollments:
          # Remove logging here, when email step when implemented
          logger.error(f"Failed to enroll User: {fail['loginId']} with Role: {fail['role']} due to {fail['error']}")
  else:
      logger.info(f"All enrollments requested by user {req_user_email} for course {course_id} is successful with {len(enrollment_params)} enrolled")

  loop_elapsed = time.perf_counter() - loop_start_time

  logger.info(f"for adding users to course {course_id} to enroll {len(enrollment_params)} users took {timedelta(seconds=loop_elapsed)}")