from backend.ccm.canvas_api.course_api_handler import CanvasCourseAPIHandler
from django.urls import path

from backend.ccm.canvas_api.course_section_api_handler import CourseSectionAPIHandler

urlpatterns = [
  path('course/<int:course_id>/', CanvasCourseAPIHandler.as_view() , name='course'),
  path('course/<int:course_id>/sections/', CourseSectionAPIHandler.as_view() , name='courseSection')
]