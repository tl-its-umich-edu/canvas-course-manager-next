from unittest.mock import patch, MagicMock
import unittest
from rest_framework.test import APITestCase, APIRequestFactory
from django.urls import reverse
from django.test import SimpleTestCase
from backend.ccm.canvas_api.section_enrollments_api_handler import SingleSectionEnrollmentView
from backend.ccm.canvas_api.enroll_users import process_login_id, enroll_user
from canvasapi.section import Section
from canvasapi import Canvas
class MultiSectionEnrollmentViewTests(APITestCase):
    @patch('backend.ccm.canvas_api.section_enrollments_api_handler.async_task')
    @patch('backend.ccm.canvas_api.section_enrollments_api_handler.reverse')
    def test_post_enroll_users_validation_error(self, mock_reverse, mock_async_task):
        """Test validation error when using 'login_id' instead of 'loginId' in enrollments data."""
        mock_async_task.return_value = 'mock-task-id'
        mock_reverse.return_value = '/mock-callback-url/'
        # Use 'login_id' instead of 'loginId' to trigger validation error
        req_data = {
            "enrollments": [
                {"login_id": "student1", "role": "student", "sectionId": 456},
                {"login_id": "student2", "role": "student", "sectionId": 789}
            ]
        }
        django_request = self.factory.post(
            self.url,
            data=req_data,
            format='json'
        )
        django_request.user = self.user
        django_request.data = req_data
        from backend.ccm.canvas_api.section_enrollments_api_handler import MultiSectionEnrollmentView
        view = MultiSectionEnrollmentView()
        response = view.post(django_request, self.course_id)
        self.assertEqual(response.status_code, 500)
        self.assertIn('errors', response.data)
        error_message = response.data['errors'][0]['message']
        self.assertIn("'loginId': [ErrorDetail(string='This field is required.'", error_message)
    def setUp(self):
        from django.contrib.auth.models import User
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.factory = APIRequestFactory()
        self.course_id = 123
        self.url = reverse('multipleSectionEnrollments', kwargs={'course_id': self.course_id})

    @patch('backend.ccm.canvas_api.section_enrollments_api_handler.async_task')
    @patch('backend.ccm.canvas_api.section_enrollments_api_handler.reverse')
    def test_post_enroll_users_success(self, mock_reverse, mock_async_task):
        # Arrange
        mock_async_task.return_value = 'mock-task-id'
        mock_reverse.return_value = '/mock-callback-url/'
        req_data = {
            "enrollments": [
                {"loginId": "student1", "role": "student", "sectionId": 456},
                {"loginId": "student2", "role": "student", "sectionId": 789}
            ]
        }
        django_request = self.factory.post(
            self.url,
            data=req_data,
            format='json'
        )
        django_request.user = self.user
        django_request.data = req_data
        from backend.ccm.canvas_api.section_enrollments_api_handler import MultiSectionEnrollmentView
        view = MultiSectionEnrollmentView()
        response = view.post(django_request, self.course_id)
        self.assertEqual(response.status_code, 200)
        self.assertIn('task_id', response.data)
        self.assertEqual(response.data['task_id'], 'mock-task-id')
        mock_async_task.assert_called_once()
        mock_reverse.assert_called_once()
class SingleSectionEnrollmentViewTests(APITestCase):
    @patch('backend.ccm.canvas_api.section_enrollments_api_handler.async_task')
    @patch('backend.ccm.canvas_api.section_enrollments_api_handler.reverse')
    def test_post_enroll_users_async_task_exception(self, mock_reverse, mock_async_task):
        """Test error response when async_task raises an exception."""
        mock_async_task.side_effect = Exception('Async task error!')
        mock_reverse.return_value = '/mock-callback-url/'
        req_data = {
            "users": [
                {"loginId": "student1", "role": "student"},
                {"loginId": "student2", "role": "student"}
            ]
        }
        django_request = self.factory.post(
            self.url,
            data=req_data,
            format='json'
        )
        django_request.user = self.user
        django_request.data = req_data
        view = SingleSectionEnrollmentView()
        response = view.post(django_request, self.course_id, self.section_id)
        self.assertEqual(response.status_code, 500)
        self.assertIn('errors', response.data)
        self.assertIn('Async task error!', str(response.data))

    @patch('backend.ccm.canvas_api.section_enrollments_api_handler.async_task')
    @patch('backend.ccm.canvas_api.section_enrollments_api_handler.reverse')
    def test_post_enroll_users_validation_error(self, mock_reverse, mock_async_task):
        """Test validation error when using 'login_id' instead of 'loginId' in request data."""
        mock_async_task.return_value = 'mock-task-id'
        mock_reverse.return_value = '/mock-callback-url/'
        # Use 'login_id' instead of 'loginId' to trigger validation error
        req_data = {
            "users": [
                {"login_id": "student1", "role": "student"},
                {"login_id": "student2", "role": "student"}
            ]
        }
        django_request = self.factory.post(
            self.url,
            data=req_data,
            format='json'
        )
        django_request.user = self.user
        django_request.data = req_data
        view = SingleSectionEnrollmentView()
        response = view.post(django_request, self.course_id, self.section_id)
        self.assertEqual(response.status_code, 500)
        self.assertIn('errors', response.data)
        error_message = response.data['errors'][0]['message']
        self.assertIn("'loginId': [ErrorDetail(string='This field is required.'", error_message)
    def setUp(self):
        from django.contrib.auth.models import User
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.factory = APIRequestFactory()
        self.course_id = 123
        self.section_id = 456
        self.url = reverse('singleSectionEnrollments', kwargs={'course_id': self.course_id, 'section_id': self.section_id})

    @patch('backend.ccm.canvas_api.section_enrollments_api_handler.async_task')
    @patch('backend.ccm.canvas_api.section_enrollments_api_handler.reverse')
    def test_post_enroll_users_success(self, mock_reverse, mock_async_task):
        # Arrange
        mock_async_task.return_value = 'mock-task-id'
        mock_reverse.return_value = '/mock-callback-url/'
        req_data = {
            "users": [
                {"loginId": "student1", "role": "student"},
                {"loginId": "student2", "role": "student"}
            ]
        }
        django_request = self.factory.post(
            self.url,
            data=req_data,
            format='json'
        )
        django_request.user = self.user
        django_request.data = req_data
        view = SingleSectionEnrollmentView()
        response = view.post(django_request, self.course_id, self.section_id)
        self.assertEqual(response.status_code, 200)
        self.assertIn('task_id', response.data)
        self.assertEqual(response.data['task_id'], 'mock-task-id')
        mock_async_task.assert_called_once()
        mock_reverse.assert_called_once()
class TestProcessLoginId(SimpleTestCase):
    def test_umich_edu(self):
        self.assertEqual(process_login_id("student@umich.edu"), "student")

    def test_med_umich_edu(self):
        self.assertEqual(process_login_id("student@med.umich.edu"), "student")

    def test_gmail(self):
        self.assertEqual(process_login_id("student@gmail.com"), "student+gmail.com")

    def test_eecs_umich_edu_upper(self):
        self.assertEqual(process_login_id("professor@eecs.UMICH.EDU"), "professor")

    def test_simple(self):
        self.assertEqual(process_login_id("student"), "student")


class TestEnrollUser(unittest.TestCase):
    @patch('backend.ccm.canvas_api.enroll_users.Section')
    def test_enroll_user_success(self, mock_section):
        # Setup
        mock_canvas = MagicMock(spec=Canvas)
        section_id = 123
        login_id = 'student@umich.edu'
        role = 'student'

        # Add the _Canvas__requester attribute to mock_canvas
        mock_requester = MagicMock()
        mock_canvas._Canvas__requester = mock_requester

        # Mock Section instance and its _requester
        mock_section_instance = MagicMock(spec=Section)
        mock_section.return_value = mock_section_instance
        mock_section_instance._requester = mock_requester

        # Mock response from Canvas API
        mock_response = MagicMock()
        mock_response.json.return_value = {'id': 1, 'user_id': '304', 'enrollment_state': 'active' ,'role': 'student'}
        mock_requester.request.return_value = mock_response

        # Patch Enrollment to just return the dict for test
        with patch('backend.ccm.canvas_api.enroll_users.Enrollment', side_effect=lambda requester, data: data):
            result = enroll_user(mock_canvas, section_id, login_id, role)

        # Assert
        mock_section.assert_called_once_with(mock_canvas._Canvas__requester, {'id': section_id})
        mock_requester.request.assert_called_once()
        self.assertEqual(result['enrollment_state'], 'active')
        self.assertEqual(result['role'], 'student')
        self.assertIn('user_id', result)

    @patch('backend.ccm.canvas_api.enroll_users.Section')
    def test_enroll_user_canvas_exception(self, mock_section):
        """Test enroll_user raises CanvasException and propagates it (unhappy path)."""
        from canvasapi.exceptions import CanvasException
        mock_canvas = MagicMock(spec=Canvas)
        section_id = 999
        login_id = 'fail@umich.edu'
        role = 'student'
        mock_requester = MagicMock()
        mock_canvas._Canvas__requester = mock_requester
        mock_section_instance = MagicMock(spec=Section)
        mock_section.return_value = mock_section_instance
        mock_section_instance._requester = mock_requester
        # Simulate CanvasException on request
        mock_requester.request.side_effect = CanvasException('API error')
        with self.assertRaises(CanvasException) as ctx:
            enroll_user(mock_canvas, section_id, login_id, role)
        self.assertIn('API error', str(ctx.exception))

    @patch('backend.ccm.canvas_api.enroll_users.Section')
    @patch('backend.ccm.canvas_api.enroll_users.settings')
    def test_enroll_user_custom_role_success(self, mock_settings, mock_section):
        # Setup
        mock_canvas = MagicMock(spec=Canvas)
        section_id = 456
        login_id = 'librarian@umich.edu'
        role = 'librarian'

        # Add the _Canvas__requester attribute to mock_canvas
        mock_requester = MagicMock()
        mock_canvas._Canvas__requester = mock_requester

        # Mock Section instance and its _requester
        mock_section_instance = MagicMock(spec=Section)
        mock_section.return_value = mock_section_instance
        mock_section_instance._requester = mock_requester

        # Mock response from Canvas API
        mock_response = MagicMock()
        mock_response.json.return_value = {'id': 2, 'user_id': '305', 'enrollment_state': 'active', 'role': 'Librarian'}
        mock_requester.request.return_value = mock_response

        # Mock settings.CUSTOM_CANVAS_ROLES
        mock_settings.CUSTOM_CANVAS_ROLES = {'librarian': 21}

        # Patch Enrollment to just return the dict for test
        with patch('backend.ccm.canvas_api.enroll_users.Enrollment', side_effect=lambda requester, data: data):
            result = enroll_user(mock_canvas, section_id, login_id, role)

        # Assert
        mock_section.assert_called_once_with(mock_canvas._Canvas__requester, {'id': section_id})
        mock_requester.request.assert_called_once()
        self.assertEqual(result['role'], 'Librarian')
        self.assertIn('user_id', result)
        # Ensure the custom role id was used
        called_kwargs = dict(mock_requester.request.call_args.kwargs['_kwargs'])
        self.assertEqual(called_kwargs['enrollment[role_id]'], 21)
