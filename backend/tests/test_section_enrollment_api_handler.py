from unittest.mock import MagicMock
from django.test import RequestFactory
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from canvasapi.section import Section
from canvasapi.enrollment import Enrollment
from canvasapi.paginated_list import PaginatedList
from django.contrib.auth.models import User
from canvasapi.exceptions import CanvasException

from backend.ccm.canvas_api.canvas_credential_manager import CanvasCredentialManager
from backend.ccm.canvas_api.exceptions import CanvasHTTPError
from backend.ccm.canvas_api.section_enrollment_api_handler import CanvasSectionEnrollmentAPIHandler

class CanvasSectionEnrollmentAPIHandlerTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.section_id = 1
        self.url = reverse('sectionEnrollment', kwargs={'section_id': self.section_id})
        self.request_factory = RequestFactory()
    
    # Mock Section Enrollment API handler view for testing
    def get_mocked_view(self, enrollment_data=None, canvasException=None):
        mock_canvas = MagicMock()
        mock_section = MagicMock(spec=Section)
        mock_manager = MagicMock(spec=CanvasCredentialManager)

        if canvasException:
            error_obj = CanvasHTTPError(canvasException.message, status.HTTP_500_INTERNAL_SERVER_ERROR, failed_input=str(self.section_id))
            mock_section.get_enrollments.side_effect = canvasException
            mock_manager.handle_canvas_api_exception.return_value = error_obj
        else:
            enrollments = [Enrollment(mock_canvas._Canvas__requester, data) for data in (enrollment_data or [])]
            mock_paginated = MagicMock(spec=PaginatedList)
            mock_paginated.__iter__.return_value = iter(enrollments or [])
            mock_section.get_enrollments.return_value = enrollments
        mock_manager.get_canvasapi_instance.return_value = mock_canvas
        mock_canvas.get_section.return_value = mock_section
        return CanvasSectionEnrollmentAPIHandler(credential_manager=mock_manager)
    
    def test_get_section_enrollments_success(self):
        request = self.request_factory.get(self.url)
        request.user = self.user

        test_enrollment_1 = {
            'id': 1,
            'sis_user_id': '12345',
            'course_section_id': self.section_id,  
            'user': {
                'id': 1,
                'name': 'Test User 1',
                'sis_user_id': '12345',
                'login_id': 'test_student_1'
            }
        }
        test_enrollment_2 = {
            'id': 2,
            'sis_user_id': '67890',
            'course_section_id': self.section_id,
            'user': {
                'id': 2,
                'name': 'Test User 2',
                'sis_user_id': '67890',
                'login_id': 'test_student_2'
            }
        }
        view = self.get_mocked_view(enrollment_data=[test_enrollment_1, test_enrollment_2])
        response = view.get(request, section_id=self.section_id)
        # Assert the response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0], 'test_student_1')
        self.assertEqual(response.data[1], 'test_student_2')
    
    def test_get_section_enrollments_empty(self):
        request = self.request_factory.get(self.url)
        request.user = self.user

        view = self.get_mocked_view(enrollment_data=[])
        response = view.get(request, section_id=self.section_id)
        # Assert the response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_get_section_enrollments_exception(self):
        request = self.request_factory.get(self.url)
        request.user = self.user

        view = self.get_mocked_view(canvasException=CanvasException('Canvas API error getting section enrollments'))
        response = view.get(request, section_id=self.section_id)
        # Assert the response
        expected_dict = {
            "statusCode": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "errors": [
                {
                    "canvasStatusCode": status.HTTP_500_INTERNAL_SERVER_ERROR,
                    "message": "Canvas API error getting section enrollments",
                    "failedInput": str(self.section_id)
                }
            ]
        }
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data, expected_dict)