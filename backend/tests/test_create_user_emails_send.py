

from django.test import TestCase
from unittest.mock import patch
from backend.ccm.background_tasks import send_email_non_umich_user_task

class SendEmailNonUmichUserTaskTests(TestCase):
	def test_send_email_logs_error_on_smtp_exception(self):
		from backend.ccm.canvas_api import email_users
		from smtplib import SMTPException
		with patch("django.core.mail.EmailMessage.send", side_effect=SMTPException("SMTP error")):
			with patch.object(email_users.logger, "error") as mock_log_error:
				email_users.send_email(
					to_email="fail@example.com",
					subject="Test",
					body="Body",
					attachment=None,
					connection=None
				)
				mock_log_error.assert_called()
				args, kwargs = mock_log_error.call_args
				assert "SMTP error" in args[0]
	def test_sending_emails_no_exception(self):
		emails = ["test1@example.com"]
		with patch("backend.ccm.background_tasks.send_email_non_umich_user_task.gather_email_send") as mock_gather:
			mock_gather.return_value = None
			try:
				send_email_non_umich_user_task.sending_emails(emails)
			except Exception as e:
				self.fail(f"Exception was raised: {e}")
	def test_sending_emails_happy_path(self):
		emails = ["test1@example.com", "test2@example.com"]
		with patch("backend.ccm.background_tasks.send_email_non_umich_user_task.gather_email_send") as mock_gather:
			mock_gather.return_value = None
			send_email_non_umich_user_task.sending_emails(emails)
			mock_gather.assert_called_once_with(emails)
