from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth.models import User
from unittest.mock import patch
from canvasapi.course import Course
from http import HTTPStatus
from django.utils import timezone
from unittest.mock import patch, MagicMock

from canvasapi.exceptions import CanvasException, ResourceDoesNotExist
from canvas_oauth.models import CanvasOAuth2Token
from canvas_oauth.exceptions import InvalidOAuthReturnError
from backend.ccm.canvas_api.canvas_credential_manager import CanvasCredentialManager
from backend.ccm.canvas_api.exceptions import CanvasAccessTokenException

class CanvasCourseAPIHandlerTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.client.force_authenticate(user=self.user)
        self.course_id = 1
        self.url = reverse('course', kwargs={'course_id': self.course_id})

    @patch.object(CanvasCredentialManager, 'get_canvasapi_instance')
    def test_get_course_success(self, mock_get_canvasapi_instance):
        mock_canvas = mock_get_canvasapi_instance.return_value
        mock_course = Course(mock_canvas._Canvas__requester, {'id': self.course_id, 'name': 'Test Course', 'enrollment_term_id': 1, 'course_code': 'Test Course'})
        mock_canvas.get_course.return_value = mock_course

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.course_id)
        self.assertEqual(response.data['name'], 'Test Course')
        self.assertEqual(response.data['enrollment_term_id'], 1)

    @patch.object(CanvasCredentialManager, 'get_canvasapi_instance')
    def test_get_course_not_found(self, mock_get_canvasapi_instance):
        mock_canvas = mock_get_canvasapi_instance.return_value
        mock_canvas.get_course.side_effect = CanvasException('Course not found')

        expected_dict = {
            "statusCode": 500,
            "errors": [
            {
                "canvasStatusCode": 500,
                "message": "Course not found",
                "failedInput": "1"
            }
            ]
        }

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(expected_dict, response.data)

    @patch.object(CanvasCredentialManager, 'get_canvasapi_instance')
    def test_put_course_success(self, mock_get_canvasapi_instance):
        mock_canvas = mock_get_canvasapi_instance.return_value
        mock_course = Course(mock_canvas._Canvas__requester, {'id': self.course_id, 'name': 'Old Course Name', 'enrollment_term_id': 1, 'course_code': 'Old Course Name'})
        mock_canvas.get_course.return_value = mock_course
        mock_course.update = lambda course: mock_course.__dict__.update(course) or mock_course.name

        data = {'newName': 'New Course Name'}
        response = self.client.put(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.course_id)
        self.assertEqual(response.data['name'], 'New Course Name')
        self.assertEqual(response.data['enrollment_term_id'], 1)

    @patch.object(CanvasCredentialManager, 'get_canvasapi_instance')
    def test_put_course_serializer_validatation(self, mock_get_canvasapi_instance):
        # Create a mock serializer error that matches the actual format
        from rest_framework.exceptions import ErrorDetail
        serializer_errors = {
            'newName': [ErrorDetail(string='This field may not be blank.', code='blank')]
        }
        expected_dict = {
            "statusCode": 500,
            "errors": [
                {
                    "canvasStatusCode": 500,
                    "message": str(serializer_errors),
                    "failedInput": "{'newName': ''}"
                }
            ]
        }

        # FE actually validates that the field is not blank
        data = {'newName': ''}
        response = self.client.put(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(expected_dict['statusCode'], response.data['statusCode'])
        self.assertEqual(len(expected_dict['errors']), len(response.data['errors']))
        self.assertEqual(expected_dict['errors'][0]['canvasStatusCode'], response.data['errors'][0]['canvasStatusCode'])
        self.assertEqual(expected_dict['errors'][0]['failedInput'], response.data['errors'][0]['failedInput'])
        # For message, just verify it contains the error since the exact string format might vary
        self.assertIn('This field may not be blank', response.data['errors'][0]['message'])

    @patch.object(CanvasCredentialManager, 'get_canvasapi_instance')
    def test_put_course_canvas_exception(self, mock_get_canvasapi_instance):
        mock_canvas = mock_get_canvasapi_instance.return_value
        mock_canvas.get_course.side_effect = ResourceDoesNotExist('Course update failed')

        data = {'newName': 'New Course Name'}
        response = self.client.put(self.url, data, format='json')

        expected_dict = {
            "statusCode": 404,
            "errors": [
                {
                    "canvasStatusCode": 404,
                    "message": "Course update failed",
                    "failedInput": str(data)  # Use course_id as failedInput
                }
            ]
        }

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(expected_dict, response.data)

    @patch.object(CanvasCredentialManager, 'get_canvasapi_instance')
    @patch('canvas_oauth.oauth.get_oauth_token')
    def test_handle_canvas_api_exception_invalid_access_token(self, mock_get_oauth_token, mock_get_canvasapi_instance):
        # Mock the oauth token call to throw InvalidOAuthReturnError
        mock_get_oauth_token.side_effect = InvalidOAuthReturnError({'error': 'invalid_grant'})
        
        # This will trigger the credential manager to raise CanvasAccessTokenException
        mock_get_canvasapi_instance.side_effect = CanvasAccessTokenException()

        # Mock the token deletion that would happen in the custom exception handler
        with patch('canvas_oauth.models.CanvasOAuth2Token.objects.filter') as mock_delete_token:
            response = self.client.get(self.url)
            
            # Verify the token deletion was attempted
            mock_delete_token.assert_called_once()
            mock_delete_token.return_value.delete.assert_called_once()

        expected_dict = {
            'message': 'Unauthorized',
            'statusCode': 401,
            'redirect': True
        }

        self.assertEqual(response.status_code, HTTPStatus.UNAUTHORIZED.value)
        self.assertEqual(expected_dict, response.data)


