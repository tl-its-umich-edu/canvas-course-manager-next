from django.shortcuts import redirect, render
from django.contrib.auth.decorators import login_required
from django.http import HttpRequest, HttpResponse
from backend import settings

# Create your views here.
@login_required
def home_view(request: HttpRequest) -> HttpResponse:
    return render(request, 'home.html')

# For /privacy/ requested by U-M OneTrust Privacy Banner
def privacy_view(request: HttpRequest) -> HttpResponse:
    return redirect(settings.PRIVACY_URL)
