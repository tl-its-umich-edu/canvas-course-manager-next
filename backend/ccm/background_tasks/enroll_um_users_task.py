import logging
import time
import asyncio
from dataclasses import dataclass
from django.test import RequestFactory
from django.contrib.auth import get_user_model
from typing import List
from canvasapi import Canvas
from backend.ccm.canvas_api.canvas_credential_manager import CanvasCredentialManager
from backend.ccm.canvas_api.enroll_users import enroll_user
from django.contrib.auth.models import User
from rest_framework.request import Request
from asgiref.sync import async_to_sync
from datetime import timedelta
from canvas_oauth.models import CanvasOAuth2Token

logger = logging.getLogger(__name__)
course_manager = CanvasCredentialManager()

@dataclass
class SectionUser:
    loginId: str
    role: str

async def enroll_user_async(canvas_api, section_id, login_id, role):
      # Wrap the sync function in a coroutine for compatibility
      return await asyncio.to_thread(enroll_user, canvas_api, section_id, login_id, role)

async def sem_task(semaphore, canvas_api, section_id, user):
    async with semaphore:
        return await enroll_user_async(canvas_api, section_id, user.loginId, user.role.lower())
    
@async_to_sync()
async def gather_enrollments(users, canvas_api, section_id):
    max_concurrent = 10  # Set your desired concurrency limit here
    semaphore = asyncio.Semaphore(max_concurrent)
    tasks = [sem_task(semaphore, canvas_api, section_id, user) for user in users]
    return await asyncio.gather(*tasks, return_exceptions=True)

def enroll_um_users(task):
  logger.info(f"Enrolling users in section with task data: {task}")

  enrollment_params: List[SectionUser] = [SectionUser(**item) for item in task.get('enrollment_params', [])]
  section_id: str = task.get('section_id')
  req_user_id: int = task.get('user_id')
  canvas_callback_url: str = task.get('canvas_callback_url')
  # Get the user model and retrieve the user instance and Canvas Token
  req_user: User = get_user_model().objects.get(pk=req_user_id)

  # Create a request factory and build the request since this is a background task request won't have a user session
  factory = RequestFactory()
  request: Request = factory.get('/oauth/oauth-callback')
  request.user = req_user
  request.build_absolute_uri = lambda path: canvas_callback_url
  canvas_api: Canvas = course_manager.get_canvasapi_instance(request)
  logger.info(f"Using Canvas API instance for user: {canvas_api}")

  loop_start_time = time.perf_counter()
  logger.info(f"Starting enrollment for {len(enrollment_params)} users in section {section_id}")

  results = gather_enrollments(enrollment_params, canvas_api, section_id)
  failed_enrollments = []
  for enroll_user, enrollment in zip(enrollment_params, results):
      login_id = enroll_user.loginId
      if isinstance(enrollment, Exception):
          failed_enrollments.append({
              'loginId': login_id,
              'role': enroll_user.role,
              'error': str(enrollment)
          })

  if failed_enrollments:
      logger.error("Failed enrollments:")
      for fail in failed_enrollments:
          logger.error(f"User: {fail['loginId']}, Role: {fail['role']}, Error: {fail['error']}")
  else:
      logger.info("All enrollments succeeded.")
 
  loop_elapsed = time.perf_counter() - loop_start_time
 
  elapsed = timedelta(seconds=loop_elapsed)

  # Log last 4 digits of Canvas access token for the user (after elapsed calculation)
  try:
      token_obj = CanvasOAuth2Token.objects.filter(user=request.user).first()
      print(f"CanvasOAuth2Token object for user {request.user.username}:", token_obj)
      if token_obj and hasattr(token_obj, 'access_token'):
          token_tail = token_obj.access_token[-4:]
          logger.info(f"Canvas access token last 4 digits for user {request.user.username}: {token_tail}")
      else:
          logger.warning(f"No CanvasOAuth2Token found for user {request.user.username}")
  except Exception as e:
      logger.error(f"Error logging Canvas access token tail: {e}")

  logger.info(f"{req_user.username} run processs took Total time taken to enroll all users {len(enrollment_params)}: {elapsed} | Canvas token last 4 digits: {token_tail if 'token_tail' in locals() else 'N/A'}")