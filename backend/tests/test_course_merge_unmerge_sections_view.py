
from unittest.mock import patch, MagicMock
from django.urls import reverse
from rest_framework.test import APITestCase,APIClient
from django.contrib.auth.models import User
from rest_framework import status
from canvasapi.exceptions import CanvasException

from canvasapi.section import Section

def mock_section(id, name, course_id):
    mock_sec = MagicMock(spec=Section)
    mock_sec.id = id
    mock_sec.name = name
    mock_sec.course_id = course_id
    return mock_sec
class CanvasCourseMergeSectionsViewTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.course_id = 1
        self.client.force_authenticate(user=self.user)
        self.url = reverse('mergeSections', kwargs={'course_id': self.course_id})

    
    @patch('backend.ccm.canvas_api.course_section_api_handler.Section.cross_list_section')
    @patch('backend.ccm.canvas_api.course_section_api_handler.CanvasCredentialManager.get_canvasapi_instance')
    @patch('backend.ccm.canvas_api.course_section_api_handler.CrosslistSectionsSerializer')
    def test_merge_sections_success(self,mock_crosslist_serializer, mock_get_canvasapi_instance, mock_cross_list_section):        
        mock_canvas_api = MagicMock()
        mock_get_canvasapi_instance.return_value = mock_canvas_api
        request_data = {
            "sectionIds": [101, 102, 103]
        }

        mock_serializer = MagicMock()
        mock_serializer.is_valid.return_value = True
        mock_serializer.validated_data =  request_data
        mock_crosslist_serializer.return_value = mock_serializer
        
        section_results_data = [
            {"id": 101, "name": "Section 101", "course_id": self.course_id},
            {"id": 102, "name": "Section 102", "course_id": self.course_id},
            {"id": 103, "name": "Section 103", "course_id": self.course_id},
        ]
        mocked_section_results = [mock_section(**data) for data in section_results_data]
        mock_cross_list_section.side_effect = mocked_section_results
        response = self.client.post(self.url, data=request_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)

        #data may be out of order
        response_dataset = {item['id']: item for item in response.data}
        expected_dataset = {data['id']: data for data in section_results_data}
        self.assertEqual(response_dataset, expected_dataset)
    
    def test_merge_sections_no_section_ids(self):
        request_data = {
            "sectionIds": []
        }
        response = self.client.post(self.url, data=request_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('errors', response.data)
        self.assertIn('This list may not be empty', response.data['errors'][0]['message'])
        self.assertIn("{'sectionIds': []}", response.data['errors'][0]['failedInput'])
        
    @patch('backend.ccm.canvas_api.course_section_api_handler.Section.cross_list_section')
    @patch('backend.ccm.canvas_api.course_section_api_handler.CanvasCredentialManager.get_canvasapi_instance')
    @patch('backend.ccm.canvas_api.course_section_api_handler.CrosslistSectionsSerializer')
    def test_merge_sections_canvas_exception(self, mock_crosslist_serializer, mock_get_canvasapi_instance, mock_cross_list_section):
        request_data = {
            "sectionIds": [101]
        }
        mock_serializer = MagicMock()
        mock_serializer.is_valid.return_value = True
        mock_serializer.validated_data = request_data
        mock_crosslist_serializer.return_value = mock_serializer

        mock_canvas_api = MagicMock()
        mock_get_canvasapi_instance.return_value = mock_canvas_api
        mock_cross_list_section.side_effect = CanvasException("Canvas API error during cross-listing")

        response = self.client.post(self.url, data=request_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('errors', response.data)
        self.assertEqual(response.data['errors'][0]['message'], 'Canvas API error during cross-listing')
    
    @patch('backend.ccm.canvas_api.course_section_api_handler.CanvasCredentialManager.get_canvasapi_instance')
    def test_merge_sections_validation_error(self, mock_get_canvasapi_instance):
        request_data = {
            "sectionIds": [111,111] 
        }

        mock_canvas_api = MagicMock()
        mock_get_canvasapi_instance.return_value = mock_canvas_api
        
        response = self.client.post(self.url, data=request_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('errors', response.data)
        self.assertIn('Duplicate section IDs are not allowed', response.data['errors'][0]['message'])
        self.assertIn("{'sectionIds': [111, 111]}", response.data['errors'][0]['failedInput'])
        
    @patch('backend.ccm.canvas_api.course_section_api_handler.Section.cross_list_section')
    @patch('backend.ccm.canvas_api.course_section_api_handler.CanvasCredentialManager.get_canvasapi_instance')
    @patch('backend.ccm.canvas_api.course_section_api_handler.CrosslistSectionsSerializer')
    def test_merge_sections_partial_failure(self, mock_crosslist_serializer, mock_get_canvasapi_instance, mock_cross_list_section):
        request_data = {
            "sectionIds": [401, 402, 403]
        }

        mock_serializer = MagicMock()
        mock_serializer.is_valid.return_value = True
        mock_serializer.validated_data = request_data
        mock_crosslist_serializer.return_value = mock_serializer

        mock_canvas_api = MagicMock()
        mock_get_canvasapi_instance.return_value = mock_canvas_api

        section_success_data = [
            {"id": 401, "name": "Section 401", "course_id": self.course_id},
        ]
        mock_cross_list_section.side_effect = [
            mock_section(**section_success_data[0]),
            CanvasException("Canvas API error during cross-listing"),
            CanvasException("Canvas API error during cross-listing")
        ]
        response = self.client.post(self.url, data=request_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('errors', response.data)
        self.assertEqual(len(response.data['errors']), 2)
        self.assertEqual(response.data['errors'][0]['message'], 'Canvas API error during cross-listing')
        self.assertIn('402', response.data['errors'][0]['failedInput'])
        self.assertEqual(response.data['errors'][1]['message'], 'Canvas API error during cross-listing')
        self.assertIn('403', response.data['errors'][1]['failedInput'])


class CanvasCourseUnmergeSectionsViewTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.course_id = 1
        self.client.force_authenticate(user=self.user)
        self.url = reverse('unmergeSections')

    @patch('backend.ccm.canvas_api.course_section_api_handler.Section.decross_list_section')
    @patch('backend.ccm.canvas_api.course_section_api_handler.CanvasCredentialManager.get_canvasapi_instance')
    @patch('backend.ccm.canvas_api.course_section_api_handler.CrosslistSectionsSerializer')
    def test_unmerge_sections_success(self, mock_crosslist_serializer, mock_get_canvasapi_instance, mock_decross_list_section):
        request_data = {
            "sectionIds": [201, 202]
        }
        mock_serializer = MagicMock()
        mock_serializer.is_valid.return_value = True
        mock_serializer.validated_data =  request_data
        mock_crosslist_serializer.return_value = mock_serializer

        section_results_data = [
            {"id": 201, "name": "Section 201", "course_id": 2},
            {"id": 202, "name": "Section 202", "course_id": 3},
        ]
        mocked_section_results = [mock_section(**data) for data in section_results_data]
        mock_decross_list_section.side_effect = mocked_section_results
        
        mock_canvas_api = MagicMock()
        mock_get_canvasapi_instance.return_value = mock_canvas_api
        response = self.client.delete(self.url, data=request_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

        response_dataset = {item['id']: item for item in response.data}
        expected_dataset = {data['id']: data for data in section_results_data}
        self.assertEqual(response_dataset, expected_dataset)

    def test_unmerge_sections_no_section_ids(self):
        request_data = {
            "sectionIds": []
        }
        response = self.client.delete(self.url, data=request_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('errors', response.data)
        self.assertIn('This list may not be empty', response.data['errors'][0]['message'])
        self.assertIn("{'sectionIds': []}", response.data['errors'][0]['failedInput'])
    
    @patch('backend.ccm.canvas_api.course_section_api_handler.Section.decross_list_section')
    @patch('backend.ccm.canvas_api.course_section_api_handler.CanvasCredentialManager.get_canvasapi_instance')
    @patch('backend.ccm.canvas_api.course_section_api_handler.CrosslistSectionsSerializer')
    def unmerge_sections_canvas_exception(self, mock_crosslist_serializer, mock_get_canvasapi_instance, mock_decross_list_section):
        request_data = {
            "sectionIds": [301]
        }
        mock_serializer = MagicMock()
        mock_serializer.is_valid.return_value = True
        mock_serializer.validated_data = request_data
        mock_crosslist_serializer.return_value = mock_serializer

        mock_canvas_api = MagicMock()
        mock_get_canvasapi_instance.return_value = mock_canvas_api
        mock_decross_list_section.side_effect = CanvasException("Canvas API error during decross-listing")

        response = self.client.delete(self.url, data=request_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('errors', response.data)
        self.assertEqual(response.data['errors'][0]['message'], 'Canvas API error during decross-listing')

    @patch('backend.ccm.canvas_api.course_section_api_handler.CanvasCredentialManager.get_canvasapi_instance')
    def test_unmerge_sections_validation_error(self, mock_get_canvasapi_instance):
        request_data = {
            "sectionIds": [111,111] 
        }
        mock_canvas_api = MagicMock()
        mock_get_canvasapi_instance.return_value = mock_canvas_api
        
        response = self.client.delete(self.url, data=request_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('errors', response.data)
        self.assertIn('Duplicate section IDs are not allowed', response.data['errors'][0]['message'])
        self.assertIn("{'sectionIds': [111, 111]}", response.data['errors'][0]['failedInput'])
    
    @patch('backend.ccm.canvas_api.course_section_api_handler.Section.decross_list_section')
    @patch('backend.ccm.canvas_api.course_section_api_handler.CanvasCredentialManager.get_canvasapi_instance')
    @patch('backend.ccm.canvas_api.course_section_api_handler.CrosslistSectionsSerializer')
    def test_unmerge_sections_partial_failure(self, mock_crosslist_serializer, mock_get_canvasapi_instance, mock_decross_list_section):
        request_data = {
            "sectionIds": [501, 502, 503]
        }

        mock_serializer = MagicMock()
        mock_serializer.is_valid.return_value = True
        mock_serializer.validated_data = request_data
        mock_crosslist_serializer.return_value = mock_serializer

        mock_canvas_api = MagicMock()
        mock_get_canvasapi_instance.return_value = mock_canvas_api

        section_success_data = [
            {"id": 501, "name": "Section 501", "course_id": 5},
            {"id": 502, "name": "Section 502", "course_id": 6},
        ]
        mock_decross_list_section.side_effect = [
            mock_section(**section_success_data[0]),
            mock_section(**section_success_data[1]),
            CanvasException("Canvas API error during decross-listing")
        ]
        response = self.client.delete(self.url, data=request_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('errors', response.data)
        print(response.data)
        self.assertEqual(len(response.data['errors']), 1)
        self.assertEqual(response.data['errors'][0]['message'], 'Canvas API error during decross-listing')
        # side_effect could be in any order with async calls
        self.assertIn('section_id ',response.data['errors'][0]['failedInput'])
