from backend.ccm.canvas_api.course_api_handler import CanvasCourseAPIHandler
from django.urls import path

urlpatterns = [
  path('course/<int:course_id>/', CanvasCourseAPIHandler.as_view() , name='course'),
]