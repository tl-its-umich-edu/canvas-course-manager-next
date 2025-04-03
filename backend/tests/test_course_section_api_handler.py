from django.test import RequestFactory
from django.urls import reverse
from backend.ccm.canvas_api.canvas_credential_manager import CanvasCredentialManager
from backend.ccm.canvas_api.course_section_api_handler import CourseSectionAPIHandler
from backend.ccm.canvas_api.exceptions import CanvasHTTPError
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from canvasapi.course import Course
from canvasapi.section import Section
from canvasapi.paginated_list import PaginatedList
from unittest.mock import MagicMock, patch
from canvasapi.exceptions import CanvasException



class CourseSectionAPIHandlerTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.course_id = 1
        self.url = reverse('courseSection', kwargs={'course_id': self.course_id})
        self.request_factory = RequestFactory()

    # Mock Course Section API handler view for testing
    def get_mocked_view(self, section_data=None, exception=None):
        mock_canvas = MagicMock()
        mock_course = MagicMock(spec=Course)
        mock_manager = MagicMock(spec=CanvasCredentialManager)

        if exception:
            error_obj = CanvasHTTPError(exception.message, status.HTTP_500_INTERNAL_SERVER_ERROR, failed_input=str(self.course_id))
            mock_course.get_sections.side_effect = exception
            mock_manager.handle_canvas_api_exception.return_value = error_obj
        else:
            sections = [Section(mock_canvas._Canvas__requester, data) for data in (section_data or [])]
            mock_paginated = MagicMock(spec=PaginatedList)
            mock_paginated.__iter__.return_value = iter(sections)
            mock_course.get_sections.return_value = mock_paginated
        mock_manager.get_canvasapi_instance.return_value = mock_canvas
        mock_canvas.get_course.return_value = mock_course
        return CourseSectionAPIHandler(credential_manager=mock_manager)

    def test_get_course_sections_success(self):
        request = self.request_factory.get(self.url)
        request.user = self.user

        mock_section_1 = {
            'id': 1,
            'name': 'Section 1',
            'course_id': self.course_id,
            'total_students': 10,
            'nonxlist_course_id': None
        }
        mock_section_2 = {
            'id': 2,
            'name': 'Section 2',
            'course_id': self.course_id,
            'total_students': 20,
            'nonxlist_course_id': None
        }
        view = self.get_mocked_view(section_data=[mock_section_1, mock_section_2])
        response = view.get(request, course_id=self.course_id)
        # Assert the response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['id'], 1)
        self.assertEqual(response.data[0]['name'], "Section 1")
        self.assertEqual(response.data[0]['total_students'], 10)
        self.assertEqual(response.data[1]['id'], 2)
        self.assertEqual(response.data[1]['name'], "Section 2")
        self.assertEqual(response.data[1]['total_students'], 20)

    def test_get_course_sections_empty(self):
        request = self.request_factory.get(self.url)
        request.user = self.user

        view = self.get_mocked_view(section_data=[])
        response = view.get(request, course_id=self.course_id)

        # Assert the response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_get_course_sections_exception(self):
        request = self.request_factory.get(self.url)
        request.user = self.user

        view = self.get_mocked_view(exception=CanvasException('Error retrieving sections'))

        response = view.get(request, course_id=self.course_id)
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
