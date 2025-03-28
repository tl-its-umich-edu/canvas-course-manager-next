from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth.models import User
from canvasapi.course import Course
from canvasapi.section import Section
from unittest.mock import MagicMock, patch
from canvasapi.exceptions import CanvasException



class CourseSectionAPIHandlerTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.client.force_authenticate(user=self.user)
        self.course_id = 1
        self.url = reverse('courseSection', kwargs={'course_id': self.course_id})

    @patch('backend.ccm.canvas_api.course_section_api_handler.CANVAS_CREDENTIALS.get_canvasapi_instance')
    def test_get_course_sections_success(self, mock_get_canvasapi_instance):
        # Mock the Canvas API instance AND canvas course
        mock_canvas = mock_get_canvasapi_instance.return_value
        mock_course = MagicMock(spec=Course)
        mock_canvas.get_course.return_value = mock_course

        mock_section_1 = Section(mock_canvas._Canvas__requester,{
            'id': 1,
            'name': 'Section 1',
            'course_id': self.course_id,
            'total_students': 10,
            'nonxlist_course_id': None
        }
        )
        mock_section_2 = Section(mock_canvas._Canvas__requester,{
            'id': 2,
            'name': 'Section 2',
            'course_id': self.course_id,
            'total_students': 20,
            'nonxlist_course_id': None
        }
        )
        mock_course.get_sections.return_value = [mock_section_1, mock_section_2]

        response = self.client.get(self.url)
        # Assert the response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['id'], 1)
        self.assertEqual(response.data[0]['name'], "Section 1")
        self.assertEqual(response.data[0]['total_students'], 10)
        self.assertEqual(response.data[1]['id'], 2)
        self.assertEqual(response.data[1]['name'], "Section 2")
        self.assertEqual(response.data[1]['total_students'], 20)

    @patch('backend.ccm.canvas_api.course_section_api_handler.CANVAS_CREDENTIALS.get_canvasapi_instance')
    def test_get_course_sections_empty(self, mock_get_canvasapi_instance):
        # Mock the Canvas API instance AND canvas course
        mock_canvas = mock_get_canvasapi_instance.return_value
        mock_course = MagicMock(spec=Course)
        mock_canvas.get_course.return_value = mock_course

        mock_course.get_sections.return_value = []

        response = self.client.get(self.url)
        # Assert the response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    @patch('backend.ccm.canvas_api.course_section_api_handler.CANVAS_CREDENTIALS.get_canvasapi_instance')
    def test_get_course_sections_exception(self, mock_get_canvasapi_instance):
        # Mock the Canvas API instance to raise a CanvasException
        mock_canvas = mock_get_canvasapi_instance.return_value
        mock_course = MagicMock(spec=Course)
        mock_canvas.get_course.return_value = mock_course

        mock_course.get_sections.side_effect = CanvasException('Error retrieving sections')

        response = self.client.get(self.url)
        # Assert the response
        expected_dict = {
            "statusCode": 500,
            "errors": [
                {
                    "canvasStatusCode": 500,
                    "message": "Error retrieving sections",
                    "failedInput": str(self.course_id)
                }
            ]
        }
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data, expected_dict)