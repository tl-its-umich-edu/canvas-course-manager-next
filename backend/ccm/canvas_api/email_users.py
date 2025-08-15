import logging
from smtplib import SMTPException
from django.conf import settings
from django.core.mail import EmailMessage
from django.core.mail.backends.base import BaseEmailBackend

logger = logging.getLogger(__name__)

def send_email(
    to_email: str,
    subject: str,
    body: str,
    attachment: tuple = None,
    connection: BaseEmailBackend = None
) -> None:
    """
    Send an email to the user. If attachment is provided, add it to the email.
    - subject: Email subject
    - attachment: tuple (filename, content, mime_type) or None
    - connection: Django email backend connection (for SMTP reuse)
    """
    try:
        email = EmailMessage(
            subject=subject,
            body=body,
            from_email=settings.EMAIL_FROM,
            to=[to_email],
            reply_to=[settings.EMAIL_TO_REPLY],
            connection=connection
        )
        if attachment:
            filename, content, mime_type = attachment
            email.attach(filename, content, mime_type)
        email.send()
    except (SMTPException, Exception) as e:
        logger.error(f"Failed to send enrollment email to {to_email}: {e}")