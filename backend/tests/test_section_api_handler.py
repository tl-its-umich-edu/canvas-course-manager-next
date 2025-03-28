from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth.models import User
from canvasapi.course import Course
from canvasapi.section import Section


class CourseSectionAPIHandlerTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.client.force_authenticate(user=self.user)
        self.section_id = 1
        self.url = reverse('section', kwargs={'course_id': self.section_id})

    @patch('backend.ccm.canvas_api.section_api_handler.CANVAS_CREDENTIALS.get_canvasapi_instance')
    def test_get_sections_success(self, mock_get_canvasapi_instance):
        mock_canvas = mock_get_canvasapi_instance.return_value
        mock_course = Course(mock_canvas._Canvas__requester, {'id': self.course_id, 'name': 'Test Course', 'enrollment_term_id': 1, 'course_code': 'Test Course'})
        mock_canvas.get_course.return_value = mock_course

        mock_section_1 = Section(
            id=1,
            name='Section 1',
            course_id=self.course_id,
            total_students=10,
            nonxlist_course_id=None
        )
        mock_section_2 = Section(
            id=2,
            name='Section 2',
            course_id=self.course_id,
            total_students=20,
            nonxlist_course_id=None
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