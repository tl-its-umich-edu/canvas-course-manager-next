from typing import Any, Dict

from django.conf import settings
from django.http import HttpRequest

from .serializer import GlobalsUserSerializer


def ccm_globals(request: HttpRequest) -> Dict[str, Any]:
    user_data = GlobalsUserSerializer(request.user).data if request.user.is_authenticated else None
    if user_data:
        user_data['hasCanvasToken'] = True  # Hardcode until Canvas OAuth integration
        userLoginID = user_data.get('loginId')  # Get the value from user_data['loginId']
    else:
        userLoginID = None
    # Access the course data from the session
    course_data = request.session.get('course', None)

    return {
      'ccm_globals': {
        'environment': 'development' if settings.DEBUGPY_ENABLE else 'production',
        'canvasURL': settings.CANVAS_INSTANCE_URL,
        'user': user_data,
        'userLoginID': userLoginID,  # Add userLoginID to the globals
        'course': course_data,
        'baseHelpURL': settings.HELP_URL,
        'googleAnalyticsId': settings.GOOGLE_ANALYTICS_ID,
        'oneTrustDomain': settings.ONE_TRUST_DOMAIN,
      }
    }
