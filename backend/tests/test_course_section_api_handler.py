from django.test import RequestFactory
from django.urls import reverse
from backend.ccm.canvas_api.canvas_credential_manager import CanvasCredentialManager
from backend.ccm.canvas_api.course_section_api_handler import CanvasCourseSectionAPIHandler
from backend.ccm.canvas_api.exceptions import CanvasErrorHandler, HTTPAPIError
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from canvasapi.course import Course
from canvasapi.section import Section
from canvasapi.paginated_list import PaginatedList
from unittest.mock import MagicMock, patch
from canvasapi.exceptions import CanvasException



class CanvasCourseSectionAPIHandlerTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.course_id = 1
        self.url = reverse('courseSection', kwargs={'course_id': self.course_id})
        self.request_factory = RequestFactory()

    # Mock Course Section API handler view for testing
    @patch('backend.ccm.canvas_api.course_section_api_handler.CanvasObjectROSerializer')
    @patch('backend.ccm.canvas_api.course_section_api_handler.Course')
    def get_mocked_view(self, mock_course_class, mock_serializer_class, section_data=None, exception=None):
        mock_canvas = MagicMock()
        mock_manager = MagicMock(spec=CanvasCredentialManager)
        mock_canvas_error_handler = MagicMock(spec=CanvasErrorHandler)

        mock_course = MagicMock(spec=Course)
        mock_course_class.return_value = mock_course
        
        mock_serializer = MagicMock()
        mock_serializer_class.return_value = mock_serializer
        
        if exception:
            # Create an HTTPAPIError first, then pass it to CanvasHTTPError
            http_api_error = HTTPAPIError(str(self.course_id), exception)
            error_obj = CanvasErrorHandler()
            error_obj.handle_canvas_api_exceptions([http_api_error])
            mock_course.get_sections.side_effect = exception
            mock_canvas_error_handler.handle_canvas_api_exceptions.return_value = error_obj
        else:
            mock_paginated = MagicMock(spec=PaginatedList)
            mock_course.get_sections.return_value = mock_paginated
            
            mock_serializer.data = section_data or []
        
        mock_manager.get_canvasapi_instance.return_value = mock_canvas
        return CanvasCourseSectionAPIHandler(credential_manager=mock_manager)

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
        
        with patch('backend.ccm.canvas_api.course_section_api_handler.Course') as mock_course_class:
            with patch.object(CanvasCredentialManager, 'get_canvasapi_instance') as mock_get_instance:
                mock_canvas = MagicMock()
                mock_get_instance.return_value = mock_canvas
                
                mock_course = MagicMock(spec=Course)
                mock_course_class.return_value = mock_course
                
                # Create simplified section objects with just the required fields
                sections = []
                for data in [mock_section_1, mock_section_2]:
                    section = type('Section', (), {})()
                    for key, value in data.items():
                        setattr(section, key, value)
                    sections.append(section)
                
                mock_paginated = MagicMock(spec=PaginatedList)
                mock_paginated.__iter__.return_value = iter(sections)
                mock_course.get_sections.return_value = mock_paginated
                
                # Create the view and test
                view = CanvasCourseSectionAPIHandler()
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

        # Use direct patching approach like section_enrollments test
        with patch('backend.ccm.canvas_api.course_section_api_handler.Course') as mock_course_class:
            with patch.object(CanvasCredentialManager, 'get_canvasapi_instance') as mock_get_instance:
                # Set up mocks
                mock_canvas = MagicMock()
                mock_get_instance.return_value = mock_canvas
                
                mock_course = MagicMock(spec=Course)
                mock_course_class.return_value = mock_course
                
                mock_paginated = MagicMock(spec=PaginatedList)
                mock_paginated.__iter__.return_value = iter([])
                mock_course.get_sections.return_value = mock_paginated
                
                # Create the view and test
                view = CanvasCourseSectionAPIHandler()
                response = view.get(request, course_id=self.course_id)

                # Assert the response
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(response.data, [])

    def test_get_course_sections_exception(self):
        request = self.request_factory.get(self.url)
        request.user = self.user

        with patch('backend.ccm.canvas_api.course_section_api_handler.Course') as mock_course_class:
            with patch.object(CanvasCredentialManager, 'get_canvasapi_instance') as mock_get_instance:
                mock_canvas = MagicMock()
                mock_get_instance.return_value = mock_canvas
                
                mock_course = MagicMock(spec=Course)
                mock_course_class.return_value = mock_course
                
                mock_course.get_sections.side_effect = CanvasException('Error retrieving sections')
                
                view = CanvasCourseSectionAPIHandler()
                response = view.get(request, course_id=self.course_id)
                
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
