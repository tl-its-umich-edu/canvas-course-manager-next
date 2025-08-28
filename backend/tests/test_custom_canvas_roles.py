import os
import importlib
import json
from django.test import SimpleTestCase

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
        # Should be the default dict
        self.assertEqual(settings.CUSTOM_CANVAS_ROLES, {'assistant': 34, 'librarian': 21})

    def test_custom_canvas_roles_env_override(self):
        os.environ[self.env_key] = '{"assistant": 99, "librarian": 88}'
        import backend.settings as settings
        importlib.reload(settings)
        self.assertEqual(settings.CUSTOM_CANVAS_ROLES, {'assistant': 99, 'librarian': 88})
