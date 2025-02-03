from typing import Any, Dict, Optional, Union

from django.conf import settings
from django.http import HttpRequest

from .serializer import GlobalsUserSerializer
from canvas_oauth.models import CanvasOAuth2Token


def ccm_globals(request: HttpRequest) -> Dict[str, Union[str, Dict[str, Any], None]]:
    user_data: Optional[Dict[str, Any]] = GlobalsUserSerializer(request.user).data if request.user.is_authenticated else None
    if user_data:
        user_data['hasCanvasToken'] = CanvasOAuth2Token.objects.filter(user=request.user).exists()
        userLoginID: Optional[str] = user_data.get('loginId')  # Get the value from user_data['loginId']
    else:
        userLoginID = None
    # Access the course data from the session
    course_data: Optional[Dict[str, Any]] = request.session.get('course', None)

    return {
      'ccm_globals': {
      'environment': 'development' if settings.DEBUGPY_ENABLE else 'production',
      'canvasURL': f"https://{settings.CANVAS_OAUTH_CANVAS_DOMAIN}",
      'user': user_data,
      'userLoginID': userLoginID,  # Add userLoginID to the globals
      'course': course_data,
      'baseHelpURL': settings.HELP_URL,
      'googleAnalyticsId': settings.GOOGLE_ANALYTICS_ID,
      'oneTrustScriptDomain': settings.ONE_TRUST_DOMAIN,
      }
    }
