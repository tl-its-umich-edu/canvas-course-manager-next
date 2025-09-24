import asyncio
import logging

from asgiref.sync import async_to_sync
from django.core.mail import get_connection
from django.conf import settings

from backend.ccm.canvas_api.email_users import send_email
from backend.ccm.utils import timeit

logger = logging.getLogger(__name__)
from backend.ccm.canvas_api.constants import MAX_CONCURRENCY

external_user_email_subject: str = "Guest invitation for University of Michigan Invited Canvas Guest Login"
guest_account_creation_link: str = settings.GUEST_ACCOUNT_CREATION_LINK

@timeit
def sending_emails(task_params: list[str]):
    """
    Background task starting point to send email to non-UMich users.
    """
    logger.info(f"Sending email to {len(task_params)} non-UMich users.: {task_params}")
    gather_email_send(task_params)

@async_to_sync()
async def gather_email_send(email_ids):
    connection = get_connection()
    logger.info(f"Opened email connection with id: {id(connection)}")
    tasks = [sem_email_task(email_id, connection) for email_id in email_ids]
    return await asyncio.gather(*tasks, return_exceptions=True)


async def sem_email_task(email_id, connection):
    semaphore = asyncio.Semaphore(MAX_CONCURRENCY)
    async with semaphore:
        return await asyncio.to_thread(send_email, email_id, external_user_email_subject, email_body(), None, connection)

def email_body() -> str:
  """
    Returns:
        str: HTML content for the email body.
  """
  body = f"""
  <p>You have been invited to access the University of Michigan's Canvas Learning Management System.</p>
  <p>You will login with a UM Friend account with this email address. If you want to use a different email address with a UM Friend Account, please contact the course instructor.</p>
  <p>To create a new UM Friend account, or check if you already have an account, click the link below (or copy and paste it into a new browser window) and follow the instructions.</p>
  <p>For help with this message, please contact 4help@umich.edu or your instructor.</p>
  <p><a href=\"{guest_account_creation_link}\">{guest_account_creation_link}</a></p>
  """
  return body