from django.test import TestCase, RequestFactory
from unittest.mock import patch, MagicMock
from backend.ccm.canvas_api.canvas_user_handler import CanvasUserHandler
from backend.ccm.canvas_api.canvasapi_serializer import LoginIdSerializer
from django.contrib.auth.models import AnonymousUser, User
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status

class TestCanvasUserHandler(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(username='testuser', email='testuser@gmail.com', password='testpass')

    @patch('backend.ccm.canvas_api.canvas_credential_manager.CanvasCredentialManager.get_canvasapi_admin_instance')
    @patch('backend.ccm.canvas_api.canvas_user_handler.CanvasObjectROSerializer')
    def test_get_user_happy_path(self, mock_serializer, mock_get_canvasapi_admin_instance):
        # Setup mocks
        mock_canvas_api = MagicMock()
        mock_get_canvasapi_admin_instance.return_value = mock_canvas_api
        mock_user_info = MagicMock()
        mock_canvas_api.get_user.return_value = mock_user_info
        mock_serializer_instance = MagicMock()
        mock_serializer.return_value = mock_serializer_instance
        mock_serializer_instance.data = {'name': 'Test User', 'login_id': 'testuser@gmail.com'}

        # Prepare request
        login_id = 'testuser@gmail.com'
        view = CanvasUserHandler()
        request = self.factory.get(f'/api/admin/user/{login_id}')
        force_authenticate(request, user=self.user)

        # Call view
        response = view.get(request, login_id)

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Test User')
        self.assertEqual(response.data['login_id'], 'testuser@gmail.com')
        mock_get_canvasapi_admin_instance.assert_called_once()
        mock_canvas_api.get_user.assert_called_once_with('testuser+gmail.com', 'sis_login_id')
        mock_serializer.assert_called_once_with(mock_user_info, allowed_fields=view.user_allowed_fields, append_fields={'login_id': login_id})

    @patch('backend.ccm.canvas_api.canvas_credential_manager.CanvasCredentialManager.get_canvasapi_admin_instance')
    @patch('backend.ccm.canvas_api.canvas_user_handler.CanvasObjectROSerializer')
    def test_get_user_exception_path(self, mock_serializer, mock_get_canvasapi_admin_instance):
        # Setup mocks
        mock_canvas_api = MagicMock()
        mock_get_canvasapi_admin_instance.return_value = mock_canvas_api
        # Simulate exception when calling get_user
        mock_canvas_api.get_user.side_effect = Exception('Test error')

        login_id = 'testuser@gmail.com'
        view = CanvasUserHandler()
        request = self.factory.get(f'/api/admin/user/{login_id}')
        force_authenticate(request, user=self.user)

        response = view.get(request, login_id)

        self.assertEqual(response.status_code, 500)
        self.assertIn('errors', response.data)
        self.assertEqual(response.data['statusCode'], 500)
        error = response.data['errors'][0]
        self.assertEqual(error['canvasStatusCode'], 500)
        self.assertEqual(error['message'], 'Test error')
        self.assertEqual(error['failedInput'], login_id)
