from unittest.mock import MagicMock, patch
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
from backend.ccm.canvas_api.exceptions import CanvasErrorHandler, HTTPAPIError
from backend.ccm.canvas_api.section_enrollments_api_handler import CanvasSectionEnrollmentsAPIHandler

class CanvasSectionEnrollmentsAPIHandlerTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.section_ids = [1, 2, 3]  # List of section IDs
        self.url = reverse('sectionEnrollments') + f"?section_ids={','.join(map(str, self.section_ids))}"
        self.request_factory = RequestFactory()
    
    # Mock Section Enrollment API handler view for testing
    def get_mocked_view(self, mock_get_enrollments, enrollment_data=[], canvasException=None):
        mock_canvas = MagicMock()
        mock_manager = MagicMock(spec=CanvasCredentialManager)
        mock_canvas_error_handler = MagicMock(spec=CanvasErrorHandler)

        if canvasException:
            def side_effect(*args, **kwargs):
                raise canvasException
            mock_get_enrollments.side_effect = side_effect
        else:
            section_id_to_enrollments = {}
            for section_id in self.section_ids: # hacky, only 3 sections & assuming section IDs start from 1
                matched_enrollments = enrollment_data[section_id - 1] 
                enrollments = [Enrollment(mock_canvas._Canvas__requester, data) for data in matched_enrollments]
                mock_paginated = MagicMock(spec=PaginatedList)
                mock_paginated.__iter__.return_value = iter(enrollments)
                section_id_to_enrollments[str(section_id)] = mock_paginated

            mock_get_enrollments.side_effect = [section_id_to_enrollments[str(id)] for id in self.section_ids]

        mock_manager.get_canvasapi_instance.return_value = mock_canvas
        return CanvasSectionEnrollmentsAPIHandler(credential_manager=mock_manager)
    
    @patch('canvasapi.section.Section.get_enrollments')
    def test_get_section_enrollments_success(self, mock_get_enrollments):
        request = self.request_factory.get(self.url)
        request.user = self.user
        request.query_params = {'section_ids': ','.join(map(str, self.section_ids))}

        test_enrollments = [
            [
                {
                    'id': 1,
                    'sis_user_id': '12345',
                    'course_section_id': self.section_ids[0],
                    'user': {
                        'id': 1,
                        'name': 'Test User 1',
                        'sis_user_id': '12345',
                        'login_id': 'test_student_1'
                    }
                },
                {
                    'id': 2,
                    'sis_user_id': '67890',
                    'course_section_id': self.section_ids[0],
                    'user': {
                        'id': 2,
                        'name': 'Test User 2',
                        'sis_user_id': '67890',
                        'login_id': 'test_student_2'
                    }
                }
            ],
            [
                {
                    'id': 3,
                    'sis_user_id': '54321',
                    'course_section_id': self.section_ids[1],
                    'user': {
                        'id': 3,
                        'name': 'Test User 3',
                        'sis_user_id': '54321',
                        'login_id': 'test_student_3'
                    }
                }
            ],
            [
                {
                    'id': 3,
                    'sis_user_id': '67890',
                    'course_section_id': self.section_ids[2],
                    'user': {
                        'id': 2,
                        'name': 'Test User 2',
                        'sis_user_id': '67890',
                        'login_id': 'test_student_2'
                    }
                }
            ]
        ]
        view = self.get_mocked_view(mock_get_enrollments, enrollment_data=test_enrollments)
        response = view.get(request)
        # Assert the response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)
        self.assertIn('test_student_1', response.data)
        self.assertIn('test_student_2', response.data)
        self.assertIn('test_student_3', response.data)
    
    @patch('canvasapi.section.Section.get_enrollments')
    def test_get_section_enrollments_empty(self, mock_get_enrollments):
        request = self.request_factory.get(self.url)
        request.user = self.user
        request.query_params = {'section_ids': ','.join(map(str, self.section_ids))}

        empty_enrollments = [[],[],[]]
        view = self.get_mocked_view(mock_get_enrollments, enrollment_data=empty_enrollments)
        response = view.get(request)
        # Assert the response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    @patch('canvasapi.section.Section.get_enrollments')
    def test_get_section_enrollments_exception(self, mock_get_enrollments):
        request = self.request_factory.get(self.url)
        request.user = self.user
        request.query_params = {'section_ids': str(self.section_ids[0])}

        view = self.get_mocked_view(mock_get_enrollments, canvasException=CanvasException('Canvas API error getting section enrollments'))
        response = view.get(request)
        # Assert the response
        expected_dict = {
            "statusCode": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "errors": [
                {
                    "canvasStatusCode": status.HTTP_500_INTERNAL_SERVER_ERROR,
                    "message": "Canvas API error getting section enrollments",
                    "failedInput": str(self.section_ids[0])
                }
            ]
        }
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data, expected_dict)