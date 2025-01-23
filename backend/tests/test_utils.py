import os
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
