from django.test import TestCase, RequestFactory
from django.contrib.auth.models import User
from canvas_oauth.models import CanvasOAuth2Token
from rest_framework.views import APIView
from rest_framework.response import Response
from backend.ccm.canvas_api.exceptions import CanvasAccessTokenException
from backend.ccm.canvas_api.drf_custom_exception_handler import custom_exception_handler
from rest_framework.test import APIClient
from django.urls import path
from django.utils import timezone
from django.test import override_settings

class TestView(APIView):
    def get(self, request):
        raise CanvasAccessTokenException()
    
class TestCustomExceptionHandler(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.token = CanvasOAuth2Token.objects.create(
            user=self.user,
            access_token='test_access_token',
            refresh_token='test_refresh_token',
            expires=timezone.now() + timezone.timedelta(days=1)
        )

    def test_custom_handler_called_for_canvas_access_token_exception(self):

        # Create request and context
        request = self.factory.get('/test/')
        request.user = self.user
        context = {'request': request}

        # Verify token exists before the call
        self.assertTrue(CanvasOAuth2Token.objects.filter(user=self.user).exists())

        # Call the handler directly with the exception
        exception = CanvasAccessTokenException()
        response = custom_exception_handler(exception, context)

        # Verify token was deleted
        self.assertFalse(CanvasOAuth2Token.objects.filter(user=self.user).exists())

        # Verify response format
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.data, {
            'message': 'Unauthorized',
            'statusCode': 401,
            'redirect': True
        })

    @override_settings(ROOT_URLCONF=__name__)
    def test_custom_handler_via_api(self):
        # Verify token exists before the call
        self.assertTrue(CanvasOAuth2Token.objects.filter(user=self.user).exists())

        # Create client and make request
        client = APIClient()
        client.force_authenticate(user=self.user)
        response = client.get('/test/')
        
        # Verify response
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json(), {
            'message': 'Unauthorized',
            'statusCode': 401,
            'redirect': True
        })
        self.assertFalse(CanvasOAuth2Token.objects.filter(user=self.user).exists())

# Add URL patterns at module level
urlpatterns = [
    path('test/', TestView.as_view())
]