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

async def gather_enrollments(users, canvas_api, section_id):
    max_concurrent = 10  # Set your desired concurrency limit here
    semaphore = asyncio.Semaphore(max_concurrent)
    tasks = [sem_task(semaphore, canvas_api, section_id, user) for user in users]
    return await asyncio.gather(*tasks, return_exceptions=True)

def enroll_um_users(task):
  logger.info(f"Enrolling users in section with task data: {task}")

  enrollment_params: List[SectionUser] = [SectionUser(**item) for item in task.get('enrollment_params', [])]
  section_id: str = task.get('section_id')
  user: int = task.get('user_id')
  canvas_callback_url: str = task.get('canvas_callback_url')
  # Get the user model and retrieve the user instance and Canvas Token
  user: User = get_user_model().objects.get(pk=user)
  
  # Create a request factory and build the request since this is a background task request won't have a user session
  factory = RequestFactory()
  request: Request = factory.get('/oauth/oauth-callback')
  request.user = user
  request.build_absolute_uri = lambda path: canvas_callback_url
  canvas_api: Canvas = course_manager.get_canvasapi_instance(request)

  loop_start_time = time.perf_counter()
  logger.info(f"Starting enrollment for {len(enrollment_params)} users in section {section_id}")
  results = async_to_sync(gather_enrollments)(enrollment_params, canvas_api, section_id)
  for user, enrollment in zip(enrollment_params, results):
      login_id = user.loginId
      if isinstance(enrollment, Exception):
          logger.error(f"Enrollment failed for {login_id}: {enrollment}")
      else:
          logger.info(f"Enrollment response for {login_id}: {enrollment}")

  loop_elapsed = time.perf_counter() - loop_start_time
 
  elapsed = timedelta(seconds=loop_elapsed)
  logger.info(f"Total time taken to enroll all users: {elapsed}")