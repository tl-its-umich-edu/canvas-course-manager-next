from django.test import SimpleTestCase, RequestFactory
from unittest.mock import patch, MagicMock
from django.conf import settings
from backend.ccm.context_processors import ccm_globals

class CCMGlobalsTests(SimpleTestCase):

    def setUp(self):
        self.factory = RequestFactory()
        self.request = self.factory.get('/')
        self.request.session = {
            'course': {
                'id': 40001,
                'roles': ['TeacherEnrollment', 'Account Admin']
            }
        }

    @patch('backend.ccm.context_processors.GlobalsUserSerializer')
    def test_ccm_globals_authenticated_user(self, mock_globals_user_serializer):
        mock_user = MagicMock(is_authenticated=True)
        self.request.user = mock_user

        mock_globals_user_serializer.return_value.data = {
            'loginId': 'jdoe',
            'isStaff': True
        }

        context = ccm_globals(self.request)

        self.assertEqual(context['ccm_globals']['environment'], 'development' if settings.DEBUGPY_ENABLE else 'production')
        self.assertEqual(context['ccm_globals']['canvasURL'], settings.CANVAS_INSTANCE_URL)
        self.assertEqual(context['ccm_globals']['user']['loginId'], 'jdoe')
        self.assertEqual(context['ccm_globals']['user']['isStaff'], True)
        self.assertEqual(context['ccm_globals']['user']['hasCanvasToken'], True)
        self.assertEqual(context['ccm_globals']['userLoginID'], 'jdoe')
        self.assertEqual(context['ccm_globals']['course']['id'], 40001)
        self.assertEqual(context['ccm_globals']['course']['roles'], ['TeacherEnrollment', 'Account Admin'])
        self.assertEqual(context['ccm_globals']['baseHelpURL'], settings.HELP_URL)
        self.assertEqual(context['ccm_globals']['googleAnalyticsId'], settings.GOOGLE_ANALYTICS_ID)
        self.assertEqual(context['ccm_globals']['oneTrustScriptDomain'], settings.ONE_TRUST_DOMAIN)
