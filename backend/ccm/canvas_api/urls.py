from backend.ccm.canvas_api.course_api_handler import CanvasCourseAPIHandler
from django.urls import path

from backend.ccm.canvas_api.course_section_api_handler import CanvasCourseSectionAPIHandler
from backend.ccm.canvas_api.section_enrollment_api_handler import CanvasSectionEnrollmentAPIHandler

urlpatterns = [
  path('course/<int:course_id>/', CanvasCourseAPIHandler.as_view() , name='course'),
  path('course/<int:course_id>/sections/', CanvasCourseSectionAPIHandler.as_view() , name='courseSection'),
  path('sections/<int:section_id>/students/', CanvasSectionEnrollmentAPIHandler.as_view() , name='sectionEnrollment'),
]