import unittest
from django.test import SimpleTestCase
from backend.ccm.canvas_scopes import DEFAUlT_CANVAS_SCOPES

class TestCanvasScope(SimpleTestCase):
    def test_canvas_scopes(self):
        expected_scopes = [
            'url:GET|/api/v1/courses/:id',
            'url:PUT|/api/v1/courses/:id',
        ]
        self.assertEqual(DEFAUlT_CANVAS_SCOPES, expected_scopes, "Canvas scopes do not match the expected values")

if __name__ == "__main__":
    unittest.main()
