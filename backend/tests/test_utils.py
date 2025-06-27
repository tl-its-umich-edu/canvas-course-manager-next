import os
import importlib
from django.test import SimpleTestCase
from backend.ccm.utils import parse_csp

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
        import backend.settings as settings
        importlib.reload(settings)
        q = settings.Q_CLUSTER
        self.assertEqual(q['workers'], 4)
        self.assertEqual(q['timeout'], 1800)
        self.assertEqual(q['retry'], 3600)
        self.assertEqual(q['bulk'], 5)

    def test_q_cluster_env_override(self):
        os.environ['Q_CLUSTER_WORKERS'] = '7'
        os.environ['Q_CLUSTER_TIMEOUT'] = '99'
        os.environ['Q_CLUSTER_RETRY'] = '1234'
        os.environ['Q_CLUSTER_BULK'] = '42'
        import backend.settings as settings
        importlib.reload(settings)
        q = settings.Q_CLUSTER
        self.assertEqual(q['workers'], 7)
        self.assertEqual(q['timeout'], 99)
        self.assertEqual(q['retry'], 1234)
        self.assertEqual(q['bulk'], 42)

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
        import backend.settings as settings
        importlib.reload(settings)
        self.assertEqual(settings.CUSTOM_CANVAS_ROLES, {'Assistant': 34, 'Librarian': 21})

    def test_custom_canvas_roles_env_override(self):
        os.environ[self.env_key] = '{"Assistant": 99, "Librarian": 88}'
        import backend.settings as settings
        importlib.reload(settings)
        self.assertEqual(settings.CUSTOM_CANVAS_ROLES, {'Assistant': 99, 'Librarian': 88})

    def test_custom_canvas_roles_env_invalid(self):
        os.environ[self.env_key] = 'not a json string'
        import backend.settings as settings
        importlib.reload(settings)
        self.assertEqual(settings.CUSTOM_CANVAS_ROLES, {'Assistant': 34, 'Librarian': 21})
