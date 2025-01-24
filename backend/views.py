import logging
from django.shortcuts import redirect, render
from django.contrib.auth.decorators import login_required
from django.http import HttpRequest, HttpResponse
from django.urls import reverse
from backend import settings

from canvas_oauth.oauth import get_oauth_token, handle_missing_token
from canvas_oauth.models import CanvasOAuth2Token
from canvas_oauth.exceptions import InvalidOAuthReturnError


logger = logging.getLogger(__name__)

@login_required
def home_view(request: HttpRequest) -> HttpResponse:
    return render(request, 'home.html')

@login_required
def redirect_oauth_view(request: HttpRequest) -> HttpResponse:
    try:
        get_oauth_token(request)
    except InvalidOAuthReturnError:
        logger.error(f"InvalidOAuthReturnError for user: {request.user}. Remove invalid refresh_token and prompt for reauthentication.")
        CanvasOAuth2Token.objects.filter(user=request.user).delete()
        return handle_missing_token(request)
    return redirect(reverse('home'))

# For /privacy/ requested by U-M OneTrust Privacy Banner
def privacy_view(request: HttpRequest) -> HttpResponse:
    return redirect(settings.PRIVACY_URL)
