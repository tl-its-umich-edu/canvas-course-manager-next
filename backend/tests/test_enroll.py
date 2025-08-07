from django.test import SimpleTestCase
from backend.ccm.canvas_api.enroll_users import process_login_id

import unittest
from unittest.mock import patch, MagicMock
from backend.ccm.canvas_api.enroll_users import enroll_user
from canvasapi.section import Section
from canvasapi.enrollment import Enrollment
from canvasapi import Canvas

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
