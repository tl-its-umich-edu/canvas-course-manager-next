from unittest.mock import patch, MagicMock
from django.utils import timezone
from rest_framework.test import APITestCase, APIRequestFactory
from django.urls import reverse
from django.test import SimpleTestCase, TestCase
from django.contrib.auth.models import User
from canvas_oauth.models import CanvasOAuth2Token
from backend.ccm.canvas_api.section_enrollments_api_handler import SingleSectionEnrollmentView
from backend.ccm.canvas_api.enroll_users import process_login_id, enroll_user
from canvasapi.section import Section
from canvasapi import Canvas
from backend.ccm.canvas_api.canvas_credential_manager import CanvasCredentialManager
from backend.ccm.background_tasks import enroll_um_users_task

class TestEnrollUmUsersBackgroundTask(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='happyuser', password='testpass', email='happyuser@umich.edu')
        self.token = CanvasOAuth2Token.objects.create(
            user=self.user,
            access_token='happy_access_token',
            refresh_token='happy_refresh_token',
            expires=timezone.now() + timezone.timedelta(days=1)
        )

    @patch('backend.ccm.background_tasks.enroll_um_users_task.gather_enrollments')
    @patch('backend.ccm.background_tasks.enroll_um_users_task.course_manager')
    def test_enroll_um_users_canvasapi_exception(self, mock_course_manager, mock_gather_enrollments):
        from backend.ccm.background_tasks.enroll_um_users_task import enroll_um_users
        # Arrange
        mock_course_manager.get_canvasapi_instance.side_effect = Exception('API instance error')
        # gather_enrollments should not be called
        mock_gather_enrollments.return_value = []
        task = {
            'enrollment_params': [
                {'loginId': 'student1', 'role': 'student', 'sectionId': 123},
                {'loginId': 'student2', 'role': 'student', 'sectionId': 123}
            ],
            'user_id': self.user.id,
            'course_id': 99,
            'canvas_callback_url': 'http://callback/'
        }
        expected_email_subject = "For course 99, 0/2 enrollments finished successfully (2 failed)"
        with patch('backend.ccm.background_tasks.enroll_um_users_task.logger.info') as mock_logger_info:
            enroll_um_users(task)
            mock_course_manager.get_canvasapi_instance.assert_called_once()
            mock_gather_enrollments.assert_not_called()
            self.assertTrue(CanvasOAuth2Token.objects.filter(user=self.user).exists())
            # Check logger.info called with expected subject
            subjects = [args[0] for args, _ in mock_logger_info.call_args_list]
            self.assertIn(expected_email_subject, subjects)
    @patch('backend.ccm.background_tasks.enroll_um_users_task.gather_enrollments')
    @patch('backend.ccm.background_tasks.enroll_um_users_task.course_manager')
    def test_enroll_um_users_happy_path(self, mock_course_manager, mock_gather_enrollments):
        from backend.ccm.background_tasks.enroll_um_users_task import enroll_um_users
        # Arrange
        mock_canvas_api = MagicMock()
        mock_course_manager.get_canvasapi_instance.return_value = mock_canvas_api
        mock_gather_enrollments.return_value = [
            {'enrollment_state': 'active', 'role': 'student', 'user_id': '1'},
            {'enrollment_state': 'active', 'role': 'teacher', 'user_id': '2'}
        ]
        task = {
            'enrollment_params': [
                {'loginId': 'student1', 'role': 'student', 'sectionId': 123},
                {'loginId': 'teacher1', 'role': 'teacher', 'sectionId': 123}
            ],
            'user_id': self.user.id,
            'course_id': 99,
            'canvas_callback_url': 'http://callback/'
        }
        expected_email_subject = "For course 99, 2/2 enrollments finished successfully"
        with patch('backend.ccm.background_tasks.enroll_um_users_task.logger.info') as mock_logger_info:
            enroll_um_users(task)
            # Assert
            mock_course_manager.get_canvasapi_instance.assert_called_once()
            mock_gather_enrollments.assert_called_once()
            self.assertTrue(CanvasOAuth2Token.objects.filter(user=self.user).exists())
            subjects = [args[0] for args, _ in mock_logger_info.call_args_list]
            self.assertIn(expected_email_subject, subjects)

    @patch('backend.ccm.background_tasks.enroll_um_users_task.gather_enrollments')
    @patch('backend.ccm.background_tasks.enroll_um_users_task.course_manager')
    def test_enroll_um_users_partial_success(self, mock_course_manager, mock_gather_enrollments):
        from backend.ccm.background_tasks.enroll_um_users_task import enroll_um_users
        from canvasapi.exceptions import CanvasException
        # Arrange
        mock_canvas_api = MagicMock()
        mock_course_manager.get_canvasapi_instance.return_value = mock_canvas_api
        # One success, one failure
        mock_gather_enrollments.return_value = [
            {'enrollment_state': 'active', 'role': 'student', 'user_id': '1'},
            CanvasException('API error')
        ]
        task = {
            'enrollment_params': [
                {'loginId': 'student1', 'role': 'student', 'sectionId': 123},
                {'loginId': 'student2', 'role': 'student', 'sectionId': 123}
            ],
            'user_id': self.user.id,
            'course_id': 99,
            'canvas_callback_url': 'http://callback/'
        }
        expected_email_subject = "For course 99, 1/2 enrollments finished successfully (1 failed)"
        with patch('backend.ccm.background_tasks.enroll_um_users_task.logger.info') as mock_logger_info:
            enroll_um_users(task)
            mock_course_manager.get_canvasapi_instance.assert_called_once()
            mock_gather_enrollments.assert_called_once()
            self.assertTrue(CanvasOAuth2Token.objects.filter(user=self.user).exists())
            subjects = [args[0] for args, _ in mock_logger_info.call_args_list]
            self.assertIn(expected_email_subject, subjects)
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
class TestEnrollUmUsersTask(TestCase):

    def setUp(self):
        self.credential_manager = CanvasCredentialManager()
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.request = MagicMock()
        self.request.user = self.user
        
        # Create a test token
        self.token = CanvasOAuth2Token.objects.create(
            user=self.user,
            access_token='test_access_token',
            refresh_token='test_refresh_token',
            expires=timezone.now() + timezone.timedelta(days=1)
        )

    @patch('backend.ccm.background_tasks.enroll_um_users_task.gather_enrollments')
    def test_enroll_um_users_happy_path(self, mock_gather_enrollments):
        from backend.ccm.background_tasks.enroll_um_users_task import enroll_um_users, course_manager
        # Arrange
        mock_canvas_api = MagicMock()
        # Swap the global course_manager instance to use self.credential_manager
        original_course_manager = course_manager
        try:
            # Patch the get_canvasapi_instance method of self.credential_manager
            self.credential_manager.get_canvasapi_instance = MagicMock(return_value=mock_canvas_api)
            # Patch the global course_manager to our test instance
            import backend.ccm.background_tasks.enroll_um_users_task as enroll_task_mod
            enroll_task_mod.course_manager = self.credential_manager
            mock_gather_enrollments.return_value = [
                {'enrollment_state': 'active', 'role': 'student', 'user_id': '1'},
                {'enrollment_state': 'active', 'role': 'teacher', 'user_id': '2'}
            ]
            task = {
                'enrollment_params': [
                    {'loginId': 'student1', 'role': 'student', 'sectionId': 123},
                    {'loginId': 'teacher1', 'role': 'teacher', 'sectionId': 123}
                ],
                'user_id': self.user.id,
                'course_id': 99,
                'canvas_callback_url': 'http://callback/'
            }
            # Act
            enroll_um_users(task)
            # Assert
            self.credential_manager.get_canvasapi_instance.assert_called_once()
            mock_gather_enrollments.assert_called_once()
            # Token should not be deleted if all succeed
            self.assertTrue(CanvasOAuth2Token.objects.filter(user=self.user).exists())
        finally:
            # Restore the original course_manager
            enroll_task_mod.course_manager = original_course_manager

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
    
    def test_complex_loginId(self):
        self.assertEqual(process_login_id("student.jane@complex.domain.com"), "student.jane+complex.domain.com")


class TestEnrollUser(SimpleTestCase):
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


class TestEmailEnrollmentSummary(TestCase):

    def get_sample_failed_enrollments(self):
        return [
            {'sectionId': 1, 'loginId': 'user1', 'role': 'student', 'error': 'Some error'},
            {'sectionId': 2, 'loginId': 'user2', 'role': 'teacher', 'error': 'Another error'}
        ]

    @patch('backend.ccm.background_tasks.enroll_um_users_task.send_email')
    def test_email_enrollment_summary_calls_send_email(self, mock_send_email):
        req_user_email = 'testuser@example.com'
        course_id = 123
        failed_enrollments = self.get_sample_failed_enrollments()
        enrollment_count = 5

        enroll_um_users_task.email_enrollment_summary(
            req_user_email=req_user_email,
            course_id=course_id,
            failed_enrollments=failed_enrollments,
            enrollment_count=enrollment_count
        )

        self.assertTrue(mock_send_email.called)
        args, kwargs = mock_send_email.call_args
        self.assertEqual(kwargs['to_email'], req_user_email)
        self.assertIn(str(course_id), kwargs['subject'])
        self.assertIn('failures', kwargs['body'])
        self.assertIsNotNone(kwargs['attachment'])