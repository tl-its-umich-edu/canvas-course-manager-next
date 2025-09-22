
from unittest.mock import patch, MagicMock
from django.test import RequestFactory
from django.urls import reverse
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from rest_framework import status
from canvasapi.exceptions import CanvasException
from rest_framework.exceptions import ErrorDetail

from backend.ccm.canvas_api.canvas_credential_manager import CanvasCredentialManager

def make_mock_section(section_data={}):
    """
    Returns a MagicMock representing a Canvas Section, or raises an exception if specified.
    section_data: dict of section fields (id, name, course_id, ...)
    raise_exception: Exception to raise when accessed (simulates CanvasException)
    """
    mock_section = MagicMock()
    if section_data:
        for k, v in section_data.items():
            setattr(mock_section, k, v)
        # For serializer compatibility, support dict-like access
        mock_section.__getitem__.side_effect = section_data.__getitem__
        mock_section.get.side_effect = section_data.get
    return mock_section

def make_mock_course(course_data={}, sections=[], raise_exception=False):
    """
    Returns a MagicMock representing a Canvas Course, with a get_sections method.
    sections: list of MagicMock sections or dicts (will be wrapped)
    raise_exception: Exception to raise when get_sections is called
    """
    mock_course = MagicMock()
    if raise_exception:
        mock_course.get_sections.side_effect = raise_exception
    else:
        # Accept both dicts and MagicMock sections
        section_objs = []
        for s in (sections):
            if isinstance(s, dict):
                section_objs.append(make_mock_section(s))
            else:
                section_objs.append(s)
        mock_course.get_sections.return_value = section_objs
    if course_data:
        for k, v in course_data.items():
            setattr(mock_course, k, v)
        # For serializer compatibility, support dict-like access
        mock_course.__getitem__.side_effect = course_data.__getitem__
        mock_course.get.side_effect = course_data.get

    return mock_course

class CanvasInstructorSectionsAPIHandlerTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.term_id = 1
        self.client.force_authenticate(user=self.user)
        self.url = reverse('instructorSections')
        self.request_factory = RequestFactory()

    @patch.object(CanvasCredentialManager, 'get_canvasapi_instance')
    def test_get_instructor_sections_success(self, mock_get_canvasapi_instance):
        mock_canvas = mock_get_canvasapi_instance.return_value

        section_1 = {'id': 111, 'name': 'Section 1', 'course_id': 1, 'nonxlist_course_id': None, 'total_students': 10}
        section_2 = {'id': 112, 'name': 'Section 2', 'course_id': 1, 'nonxlist_course_id': None, 'total_students': 8}
        section_3 = {'id': 121, 'name': 'Section 2', 'course_id': 2, 'nonxlist_course_id': None, 'total_students': 12}

        course_1 = {'id': 1, 'name': 'Course 1', 'enrollment_term_id': self.term_id}
        course_2 = {'id': 2, 'name': 'Course 2', 'enrollment_term_id': self.term_id}
        course_3 = {'id': 3, 'name': 'Course 3', 'enrollment_term_id': self.term_id}
        course_4 = {'id': 4, 'name': 'Course 4', 'enrollment_term_id': 2}  # different term
        
        # Only courses with matching term_id should be included
        mock_canvas.get_courses.return_value = [
            make_mock_course(course_1, sections=[section_1, section_2]),
            make_mock_course(course_2, sections=[section_3]),
            make_mock_course(course_3, sections=[]),  # no sections
            make_mock_course(course_4, sections=[])  # different term
        ]

        response = self.client.get(f'{self.url}?term_id={self.term_id}')
        print("test success" + str(response))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)

        resp_by_course_id = {c['id']: c for c in response.data}
        self.assertEqual(len(resp_by_course_id[1]['sections']), 2)
        self.assertEqual(len(resp_by_course_id[2]['sections']), 1)
        self.assertEqual(len(resp_by_course_id[3]['sections']), 0)
        
        self.assertEqual(resp_by_course_id[1]['sections'][0]['id'], section_1['id'])
        self.assertEqual(resp_by_course_id[1]['sections'][1]['id'], section_2['id'])
        self.assertEqual(resp_by_course_id[2]['sections'][0]['id'], section_3['id'])
    
    @patch.object(CanvasCredentialManager, 'get_canvasapi_instance')
    def test_get_instructor_sections_no_term_id(self, mock_get_canvasapi_instance):
        # Compose request without term_id
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn("term_id", response.data['errors'][0]['message'])
        self.assertIn("This field is required.", response.data['errors'][0]['message'])
    
    @patch.object(CanvasCredentialManager, 'get_canvasapi_instance')
    def test_get_instructor_sections_no_courses(self, mock_get_canvasapi_instance):
        mock_canvas = mock_get_canvasapi_instance.return_value
        mock_canvas.get_courses.return_value = []

        response = self.client.get(f'{self.url}?term_id={self.term_id}')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    @patch.object(CanvasCredentialManager, 'get_canvasapi_instance')
    def test_get_instructor_sections_exception_on_course(self, mock_get_canvasapi_instance):
        mock_canvas = mock_get_canvasapi_instance.return_value
        mock_canvas.get_courses.side_effect = CanvasException('Canvas API error')

        response = self.client.get(f'{self.url}?term_id={self.term_id}')
        
        expected_dict = {
            "statusCode": 500,
            "errors": [
                {
                    "canvasStatusCode": 500,
                    "message": "Canvas API error",
                    "failedInput": f"term_id {self.term_id}"
                }
            ]
        }
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data, expected_dict)

    @patch.object(CanvasCredentialManager, 'get_canvasapi_instance')
    def test_get_instructor_sections_exception_on_sections(self, mock_get_canvasapi_instance):
        mock_canvas = mock_get_canvasapi_instance.return_value

        # Mock a course with an exception when getting sections
        course1 = make_mock_course({'id':1, 'name':'Course 1', 'enrollment_term_id':self.term_id}, raise_exception=CanvasException('Canvas API error'))
        mock_canvas.get_courses.return_value = [course1]

        response = self.client.get(f'{self.url}?term_id={self.term_id}')

        expected_dict = {
            "statusCode": 500,
            "errors": [
                {
                    "canvasStatusCode": 500,
                    "message": "Canvas API error",
                    "failedInput":  f"course id {1}"
                }
            ]
        }
        print(response.data)
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data, expected_dict)