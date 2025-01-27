from django.test import SimpleTestCase, TestCase
from unittest.mock import MagicMock, patch
from django.contrib.auth.models import User
from django.urls import reverse

# class TestViews(SimpleTestCase):
#     def setUp(self):
#         self.user = MagicMock(spec=User)
#         self.user.is_authenticated = True
#         self.client.force_login = MagicMock()
#         self.client.force_login(self.user)
#         return super().setUp()

#     @patch('django.shortcuts.render')
#     def test_home_view(self, mock_render):
#         mock_render.return_value = MagicMock(status_code=200)
#         response = self.client.get(reverse('home'))
#         self.assertEqual(response.status_code, 200)
#         mock_render.assert_called_once_with(response.wsgi_request, 'home.html')


#     def test_user_shown_home(self):
#         response = self.client.get(reverse('home'))
#         self.assertEqual(response.status_code, 200)
#         self.assertTemplateUsed(response, 'home.html')

class TestViewsWithoutMock(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='12345')
        self.client.login(username='testuser', password='12345')
        return super().setUp()

    def test_home_view(self):
        response = self.client.get(reverse('home'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'home.html')

