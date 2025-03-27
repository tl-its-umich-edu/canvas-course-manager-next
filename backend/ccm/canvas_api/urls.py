from backend.ccm.canvas_api.course_api_handler import CanvasCourseAPIHandler
from django.urls import path

from backend.ccm.canvas_api.section_api_handler import CanvasSectionAPIHandler

urlpatterns = [
  path('course/<int:course_id>/', CanvasCourseAPIHandler.as_view() , name='course'),
  path('course/<int:course_id>/sections/', CanvasSectionAPIHandler.as_view() , name='section')
]