import os
import importlib
import json
from django.test import SimpleTestCase


class TestEmailExtraHeaders(SimpleTestCase):
    def setUp(self):
        self.settings_path = 'backend.settings'
        self.env_key = 'EMAIL_EXTRA_HEADERS'
        self.old_env = os.environ.get(self.env_key)
        if self.env_key in os.environ:
            del os.environ[self.env_key]

    def tearDown(self):
        if self.old_env is not None:
            os.environ[self.env_key] = self.old_env
        elif self.env_key in os.environ:
            del os.environ[self.env_key]

    def test_email_extra_headers_default(self):
        """Test that EMAIL_EXTRA_HEADERS uses defaults when env var is not set"""
        import backend.settings as settings
        importlib.reload(settings)
        expected = {
            "Auto-Submitted": "auto-generated",
            "X-Auto-Response-Suppress": "All",
            "Precedence": "bulk",
        }
        self.assertEqual(settings.EMAIL_EXTRA_HEADERS, expected)

    def test_email_extra_headers_env_override(self):
        """Test that EMAIL_EXTRA_HEADERS can be overridden via environment variable"""
        os.environ[self.env_key] = '{"Auto-Submitted": "auto-generated", "X-Custom-Header": "custom-value"}'
        import backend.settings as settings
        importlib.reload(settings)
        expected = {
            "Auto-Submitted": "auto-generated",
            "X-Custom-Header": "custom-value",
        }
        self.assertEqual(settings.EMAIL_EXTRA_HEADERS, expected)

    def test_email_extra_headers_env_empty_dict(self):
        """Test that EMAIL_EXTRA_HEADERS can be set to empty dict to disable headers"""
        os.environ[self.env_key] = '{}'
        import backend.settings as settings
        importlib.reload(settings)
        self.assertEqual(settings.EMAIL_EXTRA_HEADERS, {})

    def test_email_extra_headers_env_invalid_json(self):
        """Test that invalid JSON falls back to default"""
        os.environ[self.env_key] = 'not a json string'
        import backend.settings as settings
        importlib.reload(settings)
        expected = {
            "Auto-Submitted": "auto-generated",
            "X-Auto-Response-Suppress": "All",
            "Precedence": "bulk",
        }
        self.assertEqual(settings.EMAIL_EXTRA_HEADERS, expected)

    def test_email_extra_headers_env_malformed_json(self):
        """Test that malformed JSON falls back to default"""
        os.environ[self.env_key] = '{"incomplete": '
        import backend.settings as settings
        importlib.reload(settings)
        expected = {
            "Auto-Submitted": "auto-generated",
            "X-Auto-Response-Suppress": "All",
            "Precedence": "bulk",
        }
        self.assertEqual(settings.EMAIL_EXTRA_HEADERS, expected)

    def test_email_extra_headers_env_json_list(self):
        """Test that JSON list falls back to default"""
        os.environ[self.env_key] = '["header1", "header2"]'
        import backend.settings as settings
        importlib.reload(settings)
        expected = {
            "Auto-Submitted": "auto-generated",
            "X-Auto-Response-Suppress": "All",
            "Precedence": "bulk",
        }
        self.assertEqual(settings.EMAIL_EXTRA_HEADERS, expected)

    def test_email_extra_headers_env_json_string(self):
        """Test that JSON string falls back to default"""
        os.environ[self.env_key] = '"just a string"'
        import backend.settings as settings
        importlib.reload(settings)
        expected = {
            "Auto-Submitted": "auto-generated",
            "X-Auto-Response-Suppress": "All",
            "Precedence": "bulk",
        }
        self.assertEqual(settings.EMAIL_EXTRA_HEADERS, expected)

    def test_email_extra_headers_env_json_number(self):
        """Test that JSON number falls back to default"""
        os.environ[self.env_key] = '123'
        import backend.settings as settings
        importlib.reload(settings)
        expected = {
            "Auto-Submitted": "auto-generated",
            "X-Auto-Response-Suppress": "All",
            "Precedence": "bulk",
        }
        self.assertEqual(settings.EMAIL_EXTRA_HEADERS, expected)
