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
from backend.ccm.canvas_api.exceptions import CanvasErrorHandler, HTTPAPIError
from backend.ccm.canvas_api.section_enrollments_api_handler import CanvasSectionEnrollmentsAPIHandler

class CanvasSectionEnrollmentsAPIHandlerTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.section_ids = [1, 2, 3]  # List of section IDs
        self.url = reverse('sectionEnrollments') + f"?section_ids={','.join(map(str, self.section_ids))}"
        self.request_factory = RequestFactory()
    
    # Mock Section Enrollment API handler view for testing
    def get_mocked_view(self, enrollment_data=None, canvasException=None):
        mock_canvas = MagicMock()
        mock_manager = MagicMock(spec=CanvasCredentialManager)
        mock_canvas_error_handler = MagicMock(spec=CanvasErrorHandler)

        if canvasException:
            http_api_error = HTTPAPIError(str(self.section_ids[0]), canvasException)
            error_obj = CanvasErrorHandler()
            error_obj.handle_canvas_api_exceptions([http_api_error])
            mock_failing_section = MagicMock(spec=Section)
            mock_failing_section.get_enrollments.side_effect = canvasException
            mock_canvas.get_section.side_effect = [mock_failing_section] 
            mock_canvas_error_handler.handle_canvas_api_exceptions.return_value = error_obj
        else:
            mock_sections = []
            for section_id, enrollments in zip(self.section_ids, enrollment_data or []):
                mock_section = MagicMock(spec=Section)
                mock_section.get_enrollments.return_value = [
                    Enrollment(mock_canvas._Canvas__requester, data) for data in enrollments
                ]
                mock_sections.append(mock_section)
            mock_canvas.get_section.side_effect = mock_sections
        mock_manager.get_canvasapi_instance.return_value = mock_canvas
        return CanvasSectionEnrollmentsAPIHandler(credential_manager=mock_manager)
    
    def test_get_section_enrollments_success(self):
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
        view = self.get_mocked_view(enrollment_data=test_enrollments)
        response = view.get(request)
        # Assert the response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)
        self.assertIn('test_student_1', response.data)
        self.assertIn('test_student_2', response.data)
        self.assertIn('test_student_3', response.data)
    
    def test_get_section_enrollments_empty(self):
        request = self.request_factory.get(self.url)
        request.user = self.user
        request.query_params = {'section_ids': ','.join(map(str, self.section_ids))}

        empty_enrollments = [[],[],[]]
        view = self.get_mocked_view(enrollment_data=empty_enrollments)
        response = view.get(request)
        # Assert the response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_get_section_enrollments_exception(self):
        request = self.request_factory.get(self.url)
        request.user = self.user
        request.query_params = {'section_ids': str(self.section_ids[0])}

        view = self.get_mocked_view(canvasException=CanvasException('Canvas API error getting section enrollments'))
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