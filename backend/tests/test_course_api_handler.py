from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth.models import User
from unittest.mock import patch
from canvasapi.course import Course

from canvasapi.exceptions import CanvasException

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

    # @patch('backend.ccm.canvas_api.course_api_handler.CANVAS_CREDENTIALS.get_canvasapi_instance')
    # def test_get_course_not_found(self, mock_get_canvasapi_instance):
    #     mock_canvas = mock_get_canvasapi_instance.return_value
    #     mock_canvas.get_course.side_effect = CanvasException('Course not found')

    #     response = self.client.get(self.url)

    #     self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
    #     self.assertIn('Course not found', response.message)
