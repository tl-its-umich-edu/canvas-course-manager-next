from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth.models import User
from unittest.mock import patch
from canvasapi.course import Course
from http import HTTPStatus
from django.utils import timezone

from canvasapi.exceptions import CanvasException
from canvas_oauth.models import CanvasOAuth2Token
from canvas_oauth.exceptions import InvalidOAuthReturnError

class CanvasCourseAPIHandlerTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.client.force_authenticate(user=self.user)
        self.course_id = 1
        self.url = reverse('course', kwargs={'course_id': self.course_id})

    @patch('backend.ccm.canvas_api.course_api_handler.CANVAS_CREDENTIALS.get_canvasapi_instance')
    def test_get_course_success(self, mock_get_canvasapi_instance):
        mock_canvas = mock_get_canvasapi_instance.return_value
        mock_course = Course(mock_canvas._Canvas__requester, {'id': self.course_id, 'name': 'Test Course', 'enrollment_term_id': 1, 'course_code': 'Test Course'})
        mock_canvas.get_course.return_value = mock_course

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.course_id)
        self.assertEqual(response.data['name'], 'Test Course')
        self.assertEqual(response.data['enrollment_term_id'], 1)

    @patch('backend.ccm.canvas_api.course_api_handler.CANVAS_CREDENTIALS.get_canvasapi_instance')
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

    @patch('backend.ccm.canvas_api.course_api_handler.CANVAS_CREDENTIALS.get_canvasapi_instance')
    def test_put_course_success(self, mock_get_canvasapi_instance):
        mock_canvas = mock_get_canvasapi_instance.return_value
        mock_course = Course(mock_canvas._Canvas__requester, {'id': self.course_id, 'name': 'Old Course Name', 'enrollment_term_id': 1, 'course_code': 'Old Course Name'})
        mock_canvas.get_course.return_value = mock_course
        mock_course.update = lambda course: 'New Course Name'

        data = {'newName': 'New Course Name'}
        response = self.client.put(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.course_id)
        self.assertEqual(response.data['name'], 'New Course Name')
        self.assertEqual(response.data['enrollment_term_id'], 1)

    def test_put_course_serializer_validatation(self):
        # FE actually validates that the field is not blank, so this test case is just testing serializer validation
        data = {'newName': ''}
        response = self.client.put(self.url, data, format='json')

        expected_dict = [{'canvasStatusCode': 500, 'message': 'Non-standard data shape found: {"newName": ["This field may not be blank."]}', 'failedInput': "{'newName': ''}"}]

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(expected_dict, response.data['errors'])

    @patch('backend.ccm.canvas_api.course_api_handler.CANVAS_CREDENTIALS.get_canvasapi_instance')
    def test_put_course_canvas_exception(self, mock_get_canvasapi_instance):
        mock_canvas = mock_get_canvasapi_instance.return_value
        mock_canvas.get_course.side_effect = CanvasException('Course update failed')

        data = {'newName': 'New Course Name'}
        response = self.client.put(self.url, data, format='json')

        expected_dict = {
            "statusCode": 500,
            "errors": [
            {
                "canvasStatusCode": 500,
                "message": "Course update failed",
                "failedInput": "{'newName': 'New Course Name'}"
            }
            ]
        }

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(expected_dict, response.data)

    @patch('backend.ccm.canvas_api.course_api_handler.CANVAS_CREDENTIALS.get_canvasapi_instance')
    def test_handle_canvas_api_exception_invalid_access_token(self, mock_get_canvasapi_instance):

        # Create a token for the user
        
        mock_get_canvasapi_instance.side_effect = InvalidOAuthReturnError({'error': 'invalid_grant'})

        response = self.client.get(self.url)
        expected_dict = {'statusCode': 403, 'errors': [{'canvasStatusCode': 403, 'message': "{'error': 'invalid_grant'}", 'failedInput': '1'}]}

        self.assertEqual(response.status_code, HTTPStatus.FORBIDDEN.value)
        self.assertEqual(expected_dict, response.data)


