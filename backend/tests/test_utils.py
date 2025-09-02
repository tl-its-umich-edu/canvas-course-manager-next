
import os
import importlib
from django.test import SimpleTestCase
import backend.settings as settings

from datetime import timedelta
from backend.ccm.utils import parse_csp
class TestCanvasOAuthTokenExpirationBuffer(SimpleTestCase):
    def setUp(self):
        self.settings_path = 'backend.settings'
        self.env_key = 'CANVAS_OAUTH_TOKEN_EXPIRATION_BUFFER'
        self.old_env = os.environ.get(self.env_key)
        if self.env_key in os.environ:
            del os.environ[self.env_key]

    def tearDown(self):
        if self.old_env is not None:
            os.environ[self.env_key] = self.old_env
        elif self.env_key in os.environ:
            del os.environ[self.env_key]

    def test_token_expiration_buffer_default(self):
        importlib.reload(settings)
        self.assertEqual(settings.CANVAS_OAUTH_TOKEN_EXPIRATION_BUFFER, timedelta(minutes=15))

    def test_token_expiration_buffer_env_override(self):
        os.environ[self.env_key] = '42'
        importlib.reload(settings)
        self.assertEqual(settings.CANVAS_OAUTH_TOKEN_EXPIRATION_BUFFER, timedelta(minutes=42))

class TestParseCSP(SimpleTestCase):

    def setUp(self):
        # Set up the specified environment variables
        os.environ['CSP_FRAME_ANCESTORS'] = 'https://canvas.test.it.umich.edu'
        os.environ['CSP_SCRIPT_SRC'] = '*.google-analytics.com,*.analytics.google.com,*.googletagmanager.com,cdn.cookielaw.org,*.onetrust.com,portal-infoassure.it.umich.edu'

    def tearDown(self):
        # Clear the specified environment variables
        del os.environ['CSP_FRAME_ANCESTORS']
        del os.environ['CSP_SCRIPT_SRC']

    def test_parse_csp_with_env_key_set(self):
        result = parse_csp('CSP_FRAME_ANCESTORS')
        self.assertEqual(result, ["'self'", 'https://canvas.test.it.umich.edu'])

    def test_parse_csp_with_env_key_and_extra_sources(self):
        result = parse_csp('CSP_SCRIPT_SRC', ["'unsafe-inline'", "'unsafe-eval'"])
        self.assertEqual(result, [
            "'self'", '*.google-analytics.com', '*.analytics.google.com', '*.googletagmanager.com',
            'cdn.cookielaw.org', '*.onetrust.com', 'portal-infoassure.it.umich.edu', "'unsafe-inline'", "'unsafe-eval'"
        ])

    def test_parse_csp_without_env_key(self):
        result = parse_csp('CSP_NON_EXISTENT_KEY')
        self.assertEqual(result, ["'self'"])

    def test_parse_csp_without_key_extra_sources(self):
        result = parse_csp('CSP_STYLE_SRC', ["https:", "'unsafe-inline'"])
        self.assertEqual(result, ["'self'", "https:", "'unsafe-inline'"])

class TestQClusterSettings(SimpleTestCase):
    def setUp(self):
        self.settings_path = 'backend.settings'
        self.env_keys = [
            'Q_CLUSTER_WORKERS',
            'Q_CLUSTER_TIMEOUT',
            'Q_CLUSTER_RETRY',
            'Q_CLUSTER_BULK',
            'Q_CLUSTER_MAX_ATTEMPTS',
        ]
        # Save and clear any Q_CLUSTER env vars
        self.old_env = {k: os.environ.get(k) for k in self.env_keys}
        for k in self.env_keys:
            if k in os.environ:
                del os.environ[k]

    def tearDown(self):
        # Restore old env vars
        for k, v in self.old_env.items():
            if v is not None:
                os.environ[k] = v
            elif k in os.environ:
                del os.environ[k]

    def test_q_cluster_defaults(self):
        # Reload settings to pick up env changes
        importlib.reload(settings)
        q = settings.Q_CLUSTER
        self.assertEqual(q['workers'], 4)
        self.assertEqual(q['timeout'], 900)
        self.assertEqual(q['retry'], 1800)
        self.assertEqual(q['bulk'], 5)
        self.assertEqual(q['max_attempts'], 1)

    def test_q_cluster_env_override(self):
        os.environ['Q_CLUSTER_WORKERS'] = '7'
        os.environ['Q_CLUSTER_TIMEOUT'] = '99'
        os.environ['Q_CLUSTER_RETRY'] = '1234'
        os.environ['Q_CLUSTER_BULK'] = '42'
        os.environ['Q_CLUSTER_MAX_ATTEMPTS'] = '7'
        importlib.reload(settings)
        q = settings.Q_CLUSTER
        self.assertEqual(q['workers'], 7)
        self.assertEqual(q['timeout'], 99)
        self.assertEqual(q['retry'], 1234)
        self.assertEqual(q['bulk'], 42)
        self.assertEqual(q['max_attempts'], 7)

class TestCustomCanvasRoles(SimpleTestCase):
    def setUp(self):
        self.settings_path = 'backend.settings'
        self.env_key = 'CUSTOM_CANVAS_ROLES'
        self.old_env = os.environ.get(self.env_key)
        if self.env_key in os.environ:
            del os.environ[self.env_key]

    def tearDown(self):
        if self.old_env is not None:
            os.environ[self.env_key] = self.old_env
        elif self.env_key in os.environ:
            del os.environ[self.env_key]

    def test_custom_canvas_roles_default(self):
        importlib.reload(settings)
        self.assertEqual(settings.CUSTOM_CANVAS_ROLES, {'assistant': 34, 'librarian': 21})

    def test_custom_canvas_roles_env_override(self):
        os.environ[self.env_key] = '{"assistant": 99, "librarian": 88}'
        importlib.reload(settings)
        self.assertEqual(settings.CUSTOM_CANVAS_ROLES, {'assistant': 99, 'librarian': 88})

    def test_custom_canvas_roles_env_invalid(self):
        os.environ[self.env_key] = 'not a json string'
        importlib.reload(settings)
        self.assertEqual(settings.CUSTOM_CANVAS_ROLES, {'assistant': 34, 'librarian': 21})


    # Tests for EMAIL_FROM and EMAIL_SUPPORT settings
    class TestEmailSettings(SimpleTestCase):
        def test_email_host_user_password_defaults(self):
            # Ensure EMAIL_HOST_USER and EMAIL_HOST_PASSWORD default to '' when not set
            env_keys = ['EMAIL_HOST_USER', 'EMAIL_HOST_PASSWORD']
            old_env = {k: os.environ.get(k) for k in env_keys}
            for k in env_keys:
                if k in os.environ:
                    del os.environ[k]
            import importlib
            importlib.reload(settings)
            self.assertEqual(settings.EMAIL_HOST_USER, '')
            self.assertEqual(settings.EMAIL_HOST_PASSWORD, '')
            # Restore environment
            for k, v in old_env.items():
                if v is not None:
                    os.environ[k] = v
                elif k in os.environ:
                    del os.environ[k]
        def test_email_backend_default(self):
            importlib.reload(settings)
            self.assertEqual(settings.EMAIL_BACKEND, 'django.core.mail.backends.console.EmailBackend')

        def test_email_backend_env_override(self):
            os.environ['EMAIL_BACKEND'] = 'django.core.mail.backends.smtp.EmailBackend'
            importlib.reload(settings)
            self.assertEqual(settings.EMAIL_BACKEND, 'django.core.mail.backends.smtp.EmailBackend')
            del os.environ['EMAIL_BACKEND']

        def setUp(self):
            self.env_keys = [
                'EMAIL_BACKEND','EMAIL_HOST',
                'EMAIL_PORT',
                'EMAIL_USE_TLS',
                'EMAIL_FROM',
                'EMAIL_TO_REPLY',
            ]
            self.old_env = {k: os.environ.get(k) for k in self.env_keys}
            for k in self.env_keys:
                if k in os.environ:
                    del os.environ[k]

        def tearDown(self):
            for k, v in self.old_env.items():
                if v is not None:
                    os.environ[k] = v
                elif k in os.environ:
                    del os.environ[k]

        def test_email_settings_defaults_and_env(self):
            importlib.reload(settings)
            self.assertEqual(settings.EMAIL_BACKEND, 'django.core.mail.backends.console.EmailBackend')
            self.assertEqual(settings.EMAIL_HOST, 'localhost')
            self.assertEqual(settings.EMAIL_PORT, 587)
            self.assertTrue(settings.EMAIL_USE_TLS)
            self.assertEqual(settings.EMAIL_FROM, 'CANVAS-CCM-SYSTEM@UMICH.EDU')
            self.assertEqual(settings.EMAIL_TO_REPLY, '4HELP@UMICH.EDU')

            os.environ['EMAIL_BACKEND'] = 'django.core.mail.backends.smtp.EmailBackend'
            os.environ['EMAIL_HOST'] = 'smtp.umich.edu'
            os.environ['EMAIL_PORT'] = '465'
            os.environ['EMAIL_FROM'] = 'custom-from@umich.edu'
            os.environ['EMAIL_TO_REPLY'] = 'custom-support@umich.edu'
            importlib.reload(settings)
            self.assertEqual(settings.EMAIL_BACKEND, 'django.core.mail.backends.smtp.EmailBackend')
            self.assertEqual(settings.EMAIL_HOST, 'smtp.umich.edu')
            self.assertEqual(settings.EMAIL_PORT, 465)
            self.assertTrue(settings.EMAIL_USE_TLS)
            self.assertEqual(settings.EMAIL_FROM, 'custom-from@umich.edu')
            self.assertEqual(settings.EMAIL_TO_REPLY, 'custom-support@umich.edu')
            importlib.reload(settings)
            self.assertEqual(settings.EMAIL_FROM, 'custom-from@umich.edu')

        def test_email_support_env_override(self):
            importlib.reload(settings)
            self.assertEqual(settings.EMAIL_TO_REPLY, 'custom-support@umich.edu')
