import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from canvas_oauth.models import CanvasOAuth2Token
from http import HTTPStatus
from .exceptions import CanvasAccessTokenException

logger = logging.getLogger(__name__)

# https://www.django-rest-framework.org/api-guide/exceptions/#custom-exception-handling
def custom_exception_handler(exc, context):
    request = context.get('request')
    response = exception_handler(exc, context)
    if isinstance(exc, CanvasAccessTokenException):
        CanvasOAuth2Token.objects.filter(user=request.user).delete()
        logger.error(f"Deleted the Canvas OAuth2 token for user: {request.user} due to invalid canvas access token.")
        data = exc.to_dict()
        return Response(data, status=data.get("statusCode", HTTPStatus.UNAUTHORIZED.value))

    return response