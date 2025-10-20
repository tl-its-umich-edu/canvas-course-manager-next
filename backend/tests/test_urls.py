from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.conf import settings


class AdminLoginDisabledTest(TestCase):
    def setUp(self):
        self.client = Client()
        User = get_user_model()
        # create a regular user (not staff, not superuser)
        self.user = User.objects.create_user(username='regular', password='pw')

    def test_non_admin_sees_disabled_view(self):
        # ensure ENABLE_BACKEND is False for this test (default)
        settings.ENABLE_BACKEND = False

        # login the regular user
        logged_in = self.client.login(username='regular', password='pw')
        self.assertTrue(logged_in)

        # request the admin login page (follow redirects)
        response = self.client.get('/admin/', follow=True)

        # Should receive a 403 with the disabled message
        self.assertEqual(response.status_code, 403)
        self.assertIn(b'View is disabled.', response.content)

    def test_admin_user_can_access_admin(self):
        # enable backend for this test so admin is available
        settings.ENABLE_BACKEND = True

        User = get_user_model()
        # create a superuser (is_staff and is_superuser)
        admin_user = User.objects.create_superuser(username='admin', password='pw')

        # login the admin user
        logged_in = self.client.login(username='admin', password='pw')
        self.assertTrue(logged_in)

        # request the admin index
        response = self.client.get('/admin/')

        # Admin index should be accessible (200) and contain 'Site administration'
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Site administration', response.content)
