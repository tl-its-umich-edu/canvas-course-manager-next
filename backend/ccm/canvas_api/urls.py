from backend.ccm.canvas_api.course_api_handler import CanvasCourseAPIHandler
from django.urls import path

from backend.ccm.canvas_api.course_section_api_handler import CanvasCourseSectionAPIHandler
from backend.ccm.canvas_api.section_enrollments_api_handler import CanvasSectionEnrollmentsAPIHandler, SingleSectionEnrollmentView, MultiSectionEnrollmentView

urlpatterns = [
  path('course/<int:course_id>', CanvasCourseAPIHandler.as_view() , name='course'),
  path('course/<int:course_id>/sections', CanvasCourseSectionAPIHandler.as_view() , name='courseSection'),
  path('sections/students', CanvasSectionEnrollmentsAPIHandler.as_view() , name='sectionEnrollments'),
  path('course/<int:course_id>/sections/<int:section_id>/enroll', SingleSectionEnrollmentView.as_view(), name='singleSectionEnrollments'),
  path('course/<int:course_id>/sections/enroll', MultiSectionEnrollmentView.as_view(), name='multipleSectionEnrollments'),
]