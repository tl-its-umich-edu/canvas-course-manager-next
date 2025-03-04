"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from lti_tool.views import jwks, OIDCLoginInitView
from backend.ccm.canvas_api.course_api_handler import CanvasCourseAPIHandler
from backend.ccm.lti_config import CCMLTILaunchView
import watchman.views

from backend import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.home_view, name='home'),
    path(".well-known/jwks.json", jwks, name="jwks"),
    path("init/<uuid:registration_uuid>/", OIDCLoginInitView.as_view(), name="init"),
    path("ltilaunch", CCMLTILaunchView.as_view(), name="ltilaunch"),
    path('privacy/', views.privacy_view, name="privacy"),
    path('watchman/', include('watchman.urls')),
    path('watchman/bare_status/', watchman.views.bare_status),
    path('oauth/', include('canvas_oauth.urls')),
    path('redirectOAuth', views.redirect_oauth_view, name='redirect_oauth_view'),
    path('api/', include('backend.ccm.canvas_api.urls'))
]

if settings.DEBUG:
    from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

    urlpatterns += [
        path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
        path('api/schema/swagger-ui', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui')
    ] 
