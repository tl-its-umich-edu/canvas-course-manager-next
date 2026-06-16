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
    - to_email: Recipient email address
    - subject: Email subject
    - body: Email body as HTML
    - attachment: tuple (filename, content, mime_type) or None
    - connection: Django email backend connection for SMTP reuse. If not provided, the default connection is used.
                  For sending bulk emails, it is recommended to pass a single connection explicitly to improve efficiency.
    """
    try:
        # Prefix subject if EMAIL_DEBUG is True
        email_subject = subject
        if getattr(settings, 'EMAIL_DEBUG', False):
            email_subject = f"Test Email - {subject}"
        email = EmailMessage(
            subject=email_subject,
            body=body,
            from_email=settings.EMAIL_FROM,
            to=[to_email],
            reply_to=[settings.EMAIL_TO_REPLY],
            connection=connection
        )
        email.content_subtype = "html"
        # Add headers to suppress automatic replies (out-of-office, vacation, etc.)
        email.extra_headers = getattr(settings, 'EMAIL_EXTRA_HEADERS', {}) or {}
        if attachment:
            filename, content, mime_type = attachment
            email.attach(filename, content, mime_type)
        email.send()
    except (SMTPException, Exception) as e:
        logger.error(f"Failed to send enrollment email to {to_email}: {e}")