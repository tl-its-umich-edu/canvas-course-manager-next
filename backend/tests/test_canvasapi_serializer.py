
from unittest.mock import patch
from canvasapi.canvas_object import CanvasObject
from django.test import SimpleTestCase

from backend.ccm.canvas_api.canvasapi_serializer import CanvasObjectROSerializer, CourseSerializer
from backend.ccm.canvas_api.canvas_credential_manager import CanvasCredentialManager

class CanvasAPISerializerTests(SimpleTestCase):
    # --- CourseSerializer Tests ---

    def test_course_serializer_valid_data(self):
        payload = {"newName": "Updated Course Name"}
        serializer = CourseSerializer(data=payload)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["newName"], "Updated Course Name")

    def test_course_serializer_missing_required_field(self):
        serializer = CourseSerializer(data={})
        self.assertFalse(serializer.is_valid())
        self.assertIn("newName", serializer.errors)

    def test_course_serializer_too_long(self):
        long_name = "A" * 300
        serializer = CourseSerializer(data={"newName": long_name})
        self.assertFalse(serializer.is_valid())
        self.assertIn("newName", serializer.errors)

    # --- CanvasObjectROSerializer Tests ---

    @patch.object(CanvasCredentialManager, 'get_canvasapi_instance')
    def test_canvas_object_readonly_serializes_basic_fields(self, mock_get_canvasapi_instance):
        mock_canvas = mock_get_canvasapi_instance.return_value
        canvas_obj = CanvasObject(
            mock_canvas._Canvas__requester,
            {
                "id": 42,
                "name": "Test Section",
                "course_id": 999,
                "start_at": "2023-01-01T00:00:00Z",
                "active": True,
                "tags": ["alpha", "beta"]
            }
        )
        serializer = CanvasObjectROSerializer(canvas_obj)
        data = serializer.data
        
        self.assertEqual(data["id"], 42)
        self.assertEqual(data["name"], "Test Section")
        self.assertEqual(data["course_id"], 999)
        self.assertEqual(data["start_at"], "2023-01-01T00:00:00Z")
        self.assertEqual(data["active"], True)
        self.assertEqual(data["tags"], ["alpha", "beta"])
        self.assertIn("start_at_date", data)
        self.assertNotIn("_requester", data)

    @patch.object(CanvasCredentialManager, 'get_canvasapi_instance')
    def test_canvas_object_readonly_ignores_callables(self, mock_get_canvasapi_instance):
        mock_canvas = mock_get_canvasapi_instance.return_value
        canvas_obj = CanvasObject(
            mock_canvas._Canvas__requester,
            {
                "id": 42,
                "name": "Test Section",
                "course_id": 999,
                "start_at": "2023-01-01T00:00:00Z",
                "active": True,
                "tags": ["alpha", "beta"],
                "__call__": lambda: "This should not be serialized"
            }
        )
        serializer = CanvasObjectROSerializer(canvas_obj)
        data = serializer.data
        
        self.assertNotIn("__call__", data)




