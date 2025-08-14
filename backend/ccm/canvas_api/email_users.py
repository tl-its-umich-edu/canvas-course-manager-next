import csv
import io
import logging
from smtplib import SMTPException
from django.conf import settings
from django.core.mail import EmailMessage

logger = logging.getLogger(__name__)

class EmailUsers:
    def __init__(self):
        self.from_email = settings.EMAIL_FROM
        self.support_email = settings.EMAIL_SUPPORT

    def send_email(self, to_email, subject, course, failure_list=None, all_success=True):
        """
        Send an email to the user with optional error list as CSV attachment.
        - subject: Email subject
        - course: Course object or course_id (used for filename)
        - failure_list: list of failures (will be attached as <course>.csv if not None)
        - all_success: bool, if True message is 'All success', else 'Some failure. See attachment for error list.'
        """
        success_body = f"For Course {course} enrolling all users is success"
        failure_body = f"For Course {course} enrolling users encountered failures. See attachment for error list."
        body = success_body if all_success else failure_body
        try:
            email = EmailMessage(
                subject=subject,
                body=body,
                from_email=self.from_email,
                to=[to_email],
            cc=[self.support_email]
        )
          # Attach failure_list as CSV if provided
            if failure_list:
                output = io.StringIO()
                # Custom header
                fieldnames = ['sectionId', 'LoginId', 'role', 'ReasonForFailure']
                writer = csv.DictWriter(output, fieldnames=fieldnames)
                writer.writeheader()
                # Map error_list dict keys to custom header
                for item in failure_list:
                    row = {
                        'sectionId': item.get('sectionId', ''),
                        'LoginId': item.get('loginId', ''),
                        'role': item.get('role', ''),
                        'ReasonForFailure': item.get('error', '')
                    }
                    writer.writerow(row)
                csv_content = output.getvalue()
                filename = f'{course}.csv'
                mime_type = 'text/csv'
                email.attach(filename, csv_content, mime_type)
            email.send()
        except (SMTPException, Exception) as e:
            logger.error(f"Failed to send enrollment email to {to_email} for course {course}: {e}")