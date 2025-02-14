from django.test import TestCase
from unittest.mock import patch
from django.contrib.auth.models import User
from django.urls import reverse
from canvas_oauth.models import CanvasOAuth2Token
from django.utils import timezone
from backend.ccm.canvas_scopes import DEFAUlT_CANVAS_SCOPES


class TestViews(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='12345')
        self.client.login(username='testuser', password='12345')
        return super().setUp()

    def tearDown(self):
        User.objects.all().delete()
        CanvasOAuth2Token.objects.all().delete()
        super().tearDown()

    def test_home_view(self):
        response = self.client.get(reverse('home'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'home.html')

    def test_home_view_not_logged_in(self):
        self.client.logout()
        response = self.client.get(reverse('home'))
        self.assertNotEqual(response.status_code, 200)
        self.assertNotIn('home.html', [t.name for t in response.templates])

    def test_redirect_oauth_view_raises_missing_token_error(self):
        self.assertFalse(CanvasOAuth2Token.objects.filter(user=self.user).exists())
        response = self.client.get(reverse('redirect_oauth_view'))
        self.assertEqual(response.status_code, 302)
        url_redirect = response.url
        self.assertIn('/login/oauth2/auth', url_redirect)
        self.assertIn('response_type=code', url_redirect)
        scopes_encoded = '+'.join([scope.replace('|', '%7C').replace('/', '%2F').replace(':', '%3A') for scope in DEFAUlT_CANVAS_SCOPES])
        self.assertIn(f'scope={scopes_encoded}', url_redirect)

    @patch('canvas_oauth.oauth.refresh_oauth_token')
    def test_canvas_token_exists_refreshed_if_called(self, mock_refresh_oauth_token):
        expires = timezone.make_aware(timezone.datetime(2023, 12, 31, 23, 59, 59))
        CanvasOAuth2Token.objects.create(
            user=self.user, access_token='access-token', expires=expires, refresh_token='refresh-token'
        )
        refresh_token_resp = CanvasOAuth2Token(
            user=self.user,
            access_token="new-access-token",
            refresh_token="refresh-token",
            expires=timezone.now() + timezone.timedelta(seconds=3600)
        )
        self.assertTrue(self.user.is_authenticated)
        mock_refresh_oauth_token.return_value = refresh_token_resp

        response = self.client.get(reverse('redirect_oauth_view'))
        self.assertRedirects(response, reverse('home'))

    def test_redirect_oauth_view_do_not_work_for_not_authenticated_user(self):
        self.client.logout()
        response = self.client.get(reverse('redirect_oauth_view'))
        self.assertEqual(response.url, '/accounts/login/?next=/redirectOAuth')

