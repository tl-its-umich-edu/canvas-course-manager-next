from django.test import TestCase
from unittest.mock import patch, MagicMock
from django.contrib.auth.models import User
from canvas_oauth.exceptions import InvalidOAuthReturnError
from canvas_oauth.models import CanvasOAuth2Token
from backend.ccm.canvas_api.canvas_credential_manager import CanvasCredentialManager
from django.utils import timezone
from canvasapi import Canvas


class TestCanvasCredentialManager(TestCase):
    def setUp(self):
        self.credential_manager = CanvasCredentialManager()
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.request = MagicMock()
        self.request.user = self.user
        
        # Create a test token
        self.token = CanvasOAuth2Token.objects.create(
            user=self.user,
            access_token='test_access_token',
            refresh_token='test_refresh_token',
            expires=timezone.now() + timezone.timedelta(days=1)
        )

    def tearDown(self):
        self.user.delete()
        CanvasOAuth2Token.objects.all().delete()

    @patch('backend.ccm.canvas_api.canvas_credential_manager.get_oauth_token')
    @patch('backend.ccm.canvas_api.canvas_credential_manager.Canvas')
    def test_get_canvasapi_instance_success(self, mock_canvas, mock_get_oauth_token):
        # Setup
        mock_get_oauth_token.return_value = 'valid_access_token'
        mock_canvas_instance = MagicMock()
        mock_canvas.return_value = mock_canvas_instance

        # Execute
        result = self.credential_manager.get_canvasapi_instance(self.request)

        # Assert
        mock_get_oauth_token.assert_called_once_with(self.request)
        mock_canvas.assert_called_once_with(self.credential_manager.canvasURL, 'valid_access_token')
        self.assertEqual(result, mock_canvas_instance)

    @patch('backend.ccm.canvas_api.canvas_credential_manager.get_oauth_token')
    def test_get_canvasapi_instance_invalid_oauth(self, mock_get_oauth_token):
        # Setup
        mock_get_oauth_token.side_effect = InvalidOAuthReturnError("Invalid OAuth")

        # Verify token exists before the call
        self.assertTrue(CanvasOAuth2Token.objects.filter(user=self.user).exists())

        # Execute and Assert
        with self.assertRaises(InvalidOAuthReturnError):
            self.credential_manager.get_canvasapi_instance(self.request)

        # Verify token was deleted
        self.assertFalse(CanvasOAuth2Token.objects.filter(user=self.user).exists())
        mock_get_oauth_token.assert_called_once_with(self.request)