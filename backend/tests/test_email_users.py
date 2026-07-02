from django.test import TestCase, override_settings
from unittest.mock import patch, MagicMock
from backend.ccm.canvas_api import email_users

class SendEmailTests(TestCase):
    @override_settings(EMAIL_FROM='from@example.com', EMAIL_TO_REPLY='reply@example.com', EMAIL_DEBUG=True)
    @patch('backend.ccm.canvas_api.email_users.EmailMessage')
    def test_send_email_subject_prefixed_when_debugpy_enable_true(self, mock_email_message):
        mock_instance = MagicMock()
        mock_email_message.return_value = mock_instance
        email_users.send_email('to@example.com', 'Test Subject', 'Test Body')
        mock_email_message.assert_called_once_with(
            subject='Test Email - Test Subject',
            body='Test Body',
            from_email='from@example.com',
            to=['to@example.com'],
            reply_to=['reply@example.com'],
            connection=None
        )
        self.assertEqual(mock_instance.content_subtype, "html")
        mock_instance.send.assert_called_once()
        
    @override_settings(EMAIL_FROM='from@example.com', EMAIL_TO_REPLY='reply@example.com', EMAIL_DEBUG=False)
    @patch('backend.ccm.canvas_api.email_users.EmailMessage')
    def test_send_email_no_attachment(self, mock_email_message):
        mock_instance = MagicMock()
        mock_email_message.return_value = mock_instance
        email_users.send_email('to@example.com', 'Test Subject', 'Test Body')
        mock_email_message.assert_called_once_with(
                subject='Test Subject',
            body='Test Body',
            from_email='from@example.com',
            to=['to@example.com'],
            reply_to=['reply@example.com'],
            connection=None
        )
        self.assertEqual(mock_instance.content_subtype, "html")
        mock_instance.send.assert_called_once()

    @override_settings(EMAIL_FROM='from@example.com', EMAIL_TO_REPLY='reply@example.com')
    @patch('backend.ccm.canvas_api.email_users.EmailMessage')
    def test_send_email_with_attachment(self, mock_email_message):
        mock_instance = MagicMock()
        mock_email_message.return_value = mock_instance
        attachment = ('file.txt', b'content', 'text/plain')
        email_users.send_email('to@example.com', 'Test Subject', 'Test Body', attachment=attachment)
        mock_instance.attach.assert_called_once_with('file.txt', b'content', 'text/plain')
        self.assertEqual(mock_instance.content_subtype, "html")
        mock_instance.send.assert_called_once()

    @override_settings(EMAIL_FROM='from@example.com', EMAIL_TO_REPLY='reply@example.com')
    @patch('backend.ccm.canvas_api.email_users.EmailMessage')
    @patch.object(email_users, 'logger')
    def test_send_email_exception_logged(self, mock_logger, mock_email_message):
        mock_instance = MagicMock()
        mock_instance.send.side_effect = Exception('SMTP error')
        mock_email_message.return_value = mock_instance
        email_users.send_email('to@example.com', 'Test Subject', 'Test Body')
        self.assertEqual(mock_instance.content_subtype, "html")
        mock_logger.error.assert_called_once()

    @override_settings(
        EMAIL_FROM='from@example.com', 
        EMAIL_TO_REPLY='reply@example.com',
        EMAIL_EXTRA_HEADERS={
            "Auto-Submitted": "auto-generated",
            "X-Auto-Response-Suppress": "All",
            "Precedence": "bulk",
        }
    )
    @patch('backend.ccm.canvas_api.email_users.EmailMessage')
    def test_send_email_includes_auto_reply_suppression_headers(self, mock_email_message):
        mock_instance = MagicMock()
        mock_email_message.return_value = mock_instance
        email_users.send_email('to@example.com', 'Test Subject', 'Test Body')
        # Verify that extra_headers are set with auto-reply suppression headers
        expected_headers = {
            "Auto-Submitted": "auto-generated",
            "X-Auto-Response-Suppress": "All",
            "Precedence": "bulk",
        }
        self.assertEqual(mock_instance.extra_headers, expected_headers)
        mock_instance.send.assert_called_once()

    @override_settings(
        EMAIL_FROM='from@example.com', 
        EMAIL_TO_REPLY='reply@example.com',
        EMAIL_EXTRA_HEADERS=None
    )
    @patch('backend.ccm.canvas_api.email_users.EmailMessage')
    def test_send_email_handles_none_extra_headers(self, mock_email_message):
        mock_instance = MagicMock()
        mock_email_message.return_value = mock_instance
        email_users.send_email('to@example.com', 'Test Subject', 'Test Body')
        # Verify that extra_headers falls back to empty dict when None
        self.assertEqual(mock_instance.extra_headers, {})
        mock_instance.send.assert_called_once()