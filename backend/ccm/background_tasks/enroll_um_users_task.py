import logging
import time
import asyncio
import csv
import io
from dataclasses import dataclass
from typing import List
from django.test import RequestFactory
from django.contrib.auth import get_user_model
from django.conf import settings
from canvasapi import Canvas
from canvasapi.exceptions import Unauthorized
from backend.ccm.canvas_api.canvas_credential_manager import CanvasCredentialManager

from backend.ccm.canvas_api.email_users import send_email
from backend.ccm.canvas_api.enroll_users import enroll_user
from backend.ccm.canvas_api.constants import INSUFFICIENT_SCOPES_ON_ACCESS_TOKEN
from django.contrib.auth.models import User
from rest_framework.request import Request
from asgiref.sync import async_to_sync
from datetime import timedelta
from canvas_oauth.models import CanvasOAuth2Token
from backend.ccm.canvas_api.constants import MAX_CONCURRENCY


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
    max_concurrent = MAX_CONCURRENCY
    semaphore = asyncio.Semaphore(max_concurrent)
    tasks = [sem_task(semaphore, canvas_api, user) for user in enrollment_users]
    return await asyncio.gather(*tasks, return_exceptions=True)

def enroll_um_users(task):
  logger.debug(f"Enrolling users in section with task data: {task}")

  enrollment_params: List[EnrollmentUser] = [EnrollmentUser(**item) for item in task.get('enrollment_params', [])]
  req_user_id: int = task.get('user_id')
  course_id: int = task.get('course_id')
  canvas_callback_url: str = task.get('canvas_callback_url')
  # Get the user model and retrieve the user instance and Canvas Token
  req_user: User = get_user_model().objects.get(pk=req_user_id)
  req_user_email: str = req_user.email.lower()  # Ensure email is lowercase for consistency
  uniqname: str = req_user.username

  # Create a request factory and build the request since this is a background task request won't have a user session
  factory = RequestFactory()
  request: Request = factory.get('/oauth/oauth-callback')
  request.user = req_user
  request.build_absolute_uri = lambda path: canvas_callback_url
  try:
      # Get the Canvas API instance using the credential manager
      canvas_api: Canvas = course_manager.get_canvasapi_instance(request)
  except Exception as e:
      logger.error(f"Failed to get Canvas API instance for user {uniqname}: {e}")
      # Create a results list with the same exception for each enrollment param
      results = [e for _ in enrollment_params]
      handle_enrollment_results(enrollment_params, results, request, uniqname, req_user_email, course_id)
      return

  loop_start_time = time.perf_counter()
  logger.info(f"Starting enrollment for {len(enrollment_params)} users")
  results = gather_enrollments(enrollment_params, canvas_api)
  loop_elapsed = time.perf_counter() - loop_start_time

  handle_enrollment_results(enrollment_params,results,request,uniqname,req_user_email,course_id)
  logger.info(f"for adding users to course {course_id} to enroll {len(enrollment_params)} users took {timedelta(seconds=loop_elapsed)}")

def handle_enrollment_results(enrollment_params, results, request, uniqname, req_user_email, course_id):
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

    # Prepare failed list for future user notification (e.g., email)
    if failed_enrollments:
        failed_list = [
            f"{fail['loginId']} (role: {fail['role']}, section: {fail['sectionId']}) - {fail['error']}"
            for fail in failed_enrollments
        ]
        logger.error("Failed enrollments: " + "; ".join(failed_list))

    if unauthorized_scope_found:
        # This might happen when new scopes are added after the token was issued, but not going to be an issue with Prod release 
        logger.warning(f"Deleting CanvasOAuth2Token for user {uniqname} due to insufficient scopes on access token.")
        CanvasOAuth2Token.objects.filter(user=request.user).delete()
    
    email_enrollment_summary(
        req_user_email=req_user_email,
        course_id=course_id,
        failed_enrollments=failed_enrollments,
        total_enrollment_count=len(enrollment_params)
    )

def email_enrollment_summary(req_user_email: str, course_id: int, failed_enrollments: List[str], total_enrollment_count: int) -> None:
    """
    Compose and send enrollment result email, with CSV attachment if there are failures.
    """
    failed = len(failed_enrollments)
    succeeded = total_enrollment_count - failed
    course_canvas_link = f'https://{settings.CANVAS_OAUTH_CANVAS_DOMAIN}/courses/{course_id}'

    email_subject = f"For course {course_id}, {succeeded}/{total_enrollment_count} enrollments finished successfully" + (f" ({failed} failed)" if failed > 0 else "")

    # Use HTML for the body, with course_canvas_link as a hyperlink
    success_body = (
        f"For Course <a href='{course_canvas_link}'>{course_id}</a> enrolling all users is success"
    )
    failure_body = (
        f"For Course <a href='{course_canvas_link}'>{course_id}</a> enrolling users encountered failures. See attachment for error list."
    )
    body = success_body if succeeded == total_enrollment_count else failure_body

    attachment = None
    if failed_enrollments:
        try:
            output = io.StringIO()
            fieldnames = ['sectionId', 'LoginId', 'role', 'ReasonForFailure']
            writer = csv.DictWriter(output, fieldnames=fieldnames)
            writer.writeheader()
            for item in failed_enrollments:
                row = {
                    'sectionId': item.get('sectionId', ''),
                    'LoginId': item.get('loginId', ''),
                    'role': item.get('role', ''),
                    'ReasonForFailure': item.get('error', '')
                }
                writer.writerow(row)
            csv_content: str = output.getvalue()
            filename: str = f'course_{course_id}_failures.csv'
            mime_type: str = 'text/csv'
            attachment: tuple = (filename, csv_content, mime_type)
        except (ValueError, Exception) as e:
            logger.error(f"Failed to create CSV attachment for course {course_id}: {e}")

    logger.info(f"Sending enrollment summary email to {req_user_email}: {email_subject}")
    send_email(
        to_email=req_user_email,
        subject=email_subject,
        body=body,
        attachment=attachment,
    )
    