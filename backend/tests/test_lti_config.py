from django.test import SimpleTestCase, RequestFactory
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from unittest.mock import patch, MagicMock
from backend.ccm.lti_config import CCMLTILaunchView, LTILaunchError
import json

class LTILaunchTests(SimpleTestCase):

    def setUp(self):
        self.factory = RequestFactory()
        with open('backend/tests/test_fixtures/lti_launch.json') as f:
            self.lti_launch_data = json.load(f)

    def test_validate_custom_lti_launch_data_missing_params(self):
        view = CCMLTILaunchView()
        del self.lti_launch_data["https://purl.imsglobal.org/spec/lti/claim/custom"]["roles"]
        with self.assertRaises(LTILaunchError):
            view.validate_custom_lti_launch_data(self.lti_launch_data)

    @patch('backend.ccm.lti_config.User')
    @patch('random.sample', return_value=list('1234455'))
    def test_login_user_from_lti_user_does_not_exist(self, mock_random_sample, mock_user):
        view = CCMLTILaunchView()
        print(mock_random_sample)

        # Mock the User object and its methods
        mock_user.DoesNotExist = User.DoesNotExist
        mock_user.objects.get.side_effect = User.DoesNotExist
        mock_user.objects.create_user.return_value = MagicMock(username='jdoea', email='jdoea@umich.edu', password='1234455',
                                                               first_name='Johns', last_name='Does')

        user_obj = view.login_user_from_lti(self.lti_launch_data)

        # Assert that the created user has the same email and password
        created_user = mock_user.objects.create_user.return_value
        self.assertEqual(created_user, user_obj)

    @patch('backend.ccm.lti_config.ccm_user_login')
    def test_login_user_store_session(self, mock_ccm_user_login):
        view = CCMLTILaunchView()
        request = self.factory.get('/')
        request.session = {}

        user_obj = MagicMock(username='jdoe', email='jdoe@umich.edu', password='1234455', first_name='John', last_name='Doe')

        view.login_user_store_session(request, self.lti_launch_data, user_obj)

        # Assert that the user login was called
        mock_ccm_user_login.assert_called_once_with(request, user_obj)

        # Assert that the course info is stored in the session
        self.assertIn('course', request.session)
        self.assertEqual(request.session['course']['id'], 40001)
        self.assertEqual(request.session['course']['roles'], ['TeacherEnrollment', 'Account Admin'])
