import asyncio
import unittest
from unittest.mock import MagicMock, patch
from http import HTTPStatus

from rest_framework.test import APIRequestFactory

from backend.ccm.canvas_api.course_section_api_handler import CourseSectionAPIHandler
from backend.ccm.canvas_api.canvas_credential_manager import CanvasCredentialManager
from backend.ccm.canvas_api.exceptions import CanvasErrorHandler, HTTPAPIError
from canvasapi.exceptions import CanvasException


class TestCourseSectionAPIHandler(unittest.TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.credential_manager = MagicMock(spec=CanvasCredentialManager)
        self.mock_canvas_error_handler = MagicMock(spec=CanvasErrorHandler)
        self.api_handler = CourseSectionAPIHandler(credential_manager=self.credential_manager)
        self.api_handler.canvas_error = self.mock_canvas_error_handler
        
        # Mock Canvas API instance
        self.canvas_api = MagicMock()
        self.credential_manager.get_canvasapi_instance.return_value = self.canvas_api
        
        # Mock course
        self.course = MagicMock()
        self.canvas_api.get_course.return_value = self.course
        
        # Test data
        self.course_id = 12345
        self.section_names = ["Section A", "Section B", "Section C"]
        
    @patch('backend.ccm.canvas_api.course_section_api_handler.asyncio.to_thread')
    @patch('backend.ccm.canvas_api.course_section_api_handler.time.perf_counter')
    def test_create_sections_happy_path(self, mock_perf_counter, mock_to_thread):
        """Test successful concurrent creation of multiple sections."""
        # Simplify the test by mocking the response directly
        mock_perf_counter.side_effect = [100.0, 100.5]

        # Create request with section data
        request_data = {"sections": self.section_names}
        request = self.factory.post(
            f'/api/canvas/courses/{self.course_id}/sections', 
            data=request_data,
            format='json'
        )
        request.data = request_data

        # Mock serializer validation
        with patch('backend.ccm.canvas_api.course_section_api_handler.CourseSectionSerializer') as mock_serializer_class:
            mock_serializer = MagicMock()
            mock_serializer.is_valid.return_value = True
            mock_serializer.validated_data = request_data
            mock_serializer_class.return_value = mock_serializer

            # Mock section creation results
            section_results = [
                {
                    "id": 1000 + i,
                    "name": name,
                    "course_id": self.course_id,
                    "total_students": 0,
                    "nonxlist_course_id": None
                } for i, name in enumerate(self.section_names)
            ]

            # Mock to_thread to return section results
            mock_to_thread.side_effect = lambda func, *args, **kwargs: section_results.pop(0)

            # Execute the API call
            response = self.api_handler.post(request, self.course_id)

            # Verify response status and structure
            self.assertEqual(response.status_code, HTTPStatus.CREATED)
            self.assertEqual(len(response.data), len(self.section_names))

            # Verify each section was created with correct data
            for i, section_name in enumerate(self.section_names):
                section_data = response.data[i]
                self.assertEqual(section_data["id"], 1000 + i)
                self.assertEqual(section_data["name"], section_name)
                self.assertEqual(section_data["course_id"], self.course_id)
                self.assertEqual(section_data["total_students"], 0)
                self.assertIsNone(section_data["nonxlist_course_id"])

            # Verify concurrency - to_thread should be called for each section
            self.assertEqual(mock_to_thread.call_count, len(self.section_names))
            
    def test_create_sections_validation_error(self):
        """Test that serializer validates section count doesn't exceed 60."""
        # Create request with too many sections
        request_data = {"sections": [f"Section {i}" for i in range(61)]}
        request = self.factory.post(
            f'/api/canvas/courses/{self.course_id}/sections',
            data=request_data,
            format='json'
        )
        request.data = request_data
        
        # Mock the error response
        mock_error_response = {
            'statusCode': HTTPStatus.INTERNAL_SERVER_ERROR.value,
            'errors': [{
                'canvasStatusCode': HTTPStatus.INTERNAL_SERVER_ERROR.value,
                'message': "The list cannot be more than 60 items.",
                'failedInput': str(request_data)
            }]
        }
        self.mock_canvas_error_handler.to_dict.return_value = mock_error_response
        
        # Execute the API call
        response = self.api_handler.post(request, self.course_id)
        
        # Verify response
        self.assertEqual(response.status_code, HTTPStatus.INTERNAL_SERVER_ERROR.value)
        self.assertEqual(response.data, mock_error_response)

    @patch('backend.ccm.canvas_api.course_section_api_handler.asyncio.to_thread')
    @patch('backend.ccm.canvas_api.course_section_api_handler.time.perf_counter')
    def test_create_sections_partial_success(self, mock_perf_counter, mock_to_thread):
        """Test scenario where some sections succeed and others fail."""
        # Configure perf_counter mock
        mock_perf_counter.side_effect = [100.0, 100.5]

        # Create request with 6 sections
        section_names = [f"Section {i}" for i in range(6)]
        request_data = {"sections": section_names}
        request = self.factory.post(
            f'/api/canvas/courses/{self.course_id}/sections',
            data=request_data,
            format='json'
        )
        request.data = request_data

        # Mock serializer validation
        with patch('backend.ccm.canvas_api.course_section_api_handler.CourseSectionSerializer') as mock_serializer_class:
            mock_serializer = MagicMock()
            mock_serializer.is_valid.return_value = True
            mock_serializer.validated_data = request_data
            mock_serializer_class.return_value = mock_serializer

            # Mock section creation results - 3 success, 3 failures
            async def mock_async_result(func, *args, **kwargs):
                section_name = args[2]  # Third argument is section_name
                section_index = int(section_name.split()[-1])
                
                if section_index < 3:  # First 3 sections succeed
                    return {
                        "id": 1000 + section_index,
                        "name": section_name,
                        "course_id": self.course_id,
                        "total_students": 0
                    }
                else:  # Last 3 sections fail
                    canvas_error = CanvasException("Section creation failed")
                    return HTTPAPIError(section_name, canvas_error)

            mock_to_thread.side_effect = mock_async_result

            # Mock error handler response
            mock_error_response = {
                'statusCode': HTTPStatus.INTERNAL_SERVER_ERROR.value,
                'errors': [{
                    'canvasStatusCode': HTTPStatus.INTERNAL_SERVER_ERROR.value,
                    'message': "Section creation failed",
                    'failedInput': f"Section {i}"
                } for i in range(3, 6)]
            }
            self.mock_canvas_error_handler.to_dict.return_value = mock_error_response

            # Execute the API call
            response = self.api_handler.post(request, self.course_id)

            # Verify response
            self.assertEqual(response.status_code, HTTPStatus.INTERNAL_SERVER_ERROR.value)
            self.assertEqual(mock_to_thread.call_count, 6)  # All 6 sections were attempted
            self.assertEqual(response.data, mock_error_response)