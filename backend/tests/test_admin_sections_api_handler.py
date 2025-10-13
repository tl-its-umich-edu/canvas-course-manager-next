
from unittest.mock import patch, MagicMock
from django.test import RequestFactory
from django.urls import reverse
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from rest_framework import status
from canvasapi.exceptions import CanvasException
from rest_framework.exceptions import ErrorDetail


from backend.ccm.canvas_api.canvas_credential_manager import CanvasCredentialManager
from backend.ccm.canvas_api.constants import MAX_SEARCH_COURSES
from backend.ccm.canvas_api.exceptions import HTTPAPIError
from backend.ccm.canvas_api.admin_sections_api_handler import CanvasAdminSectionsAPIHandler
from canvasapi.exceptions import ResourceDoesNotExist

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

def make_mock_course(id, name, enrollment_term_id, sections=[], raise_exception=False):
    """
    Returns a MagicMock representing a Canvas Course, with a get_sections method.
    sections: list of MagicMock sections or dicts (will be wrapped)
    raise_exception: Exception to raise when get_sections is called
    """
    mock_course = MagicMock()
    mock_course.id = id
    mock_course.name = name
    mock_course.enrollment_term_id = enrollment_term_id
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
    return mock_course

def make_mock_account(id, parent_account_id, courses=[], raise_exception=False):
    """
    Returns a MagicMock representing a Canvas Account, with get_courses method.
    courses: list of MagicMock courses or dicts (will be wrapped)
    raise_exception: Exception to raise when either method is called
    """
    mock_account = MagicMock()
    mock_account.id = id
    mock_account.parent_account_id = parent_account_id
    if raise_exception:
        mock_account.get_courses.side_effect = raise_exception
    else:
        course_objs = []
        for c in (courses):
            if isinstance(c, dict):
                course_objs.append(make_mock_course(**c))
            else:
                course_objs.append(c)
        mock_account.get_courses.return_value = course_objs
    
    return mock_account

class CanvasAdminSectionsAPIHandlerTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.term_id = 1
        self.instructor_name = 'jdoe'
        self.course_name = 'test course'
        self.client.force_authenticate(user=self.user)
        self.url = reverse('adminSections')
        self.request_factory = RequestFactory()

    @patch.object(CanvasCredentialManager, 'get_canvasapi_instance')
    def test_get_admin_sections_by_instructor_name_success(self, mock_get_canvasapi_instance):
        mock_canvas = mock_get_canvasapi_instance.return_value

        section_1 = {'id': 111, 'name': 'Section 1', 'course_id': 1, 'nonxlist_course_id': None, 'total_students': 10}
        section_2 = {'id': 112, 'name': 'Section 2', 'course_id': 1, 'nonxlist_course_id': None, 'total_students': 8}
        section_3 = {'id': 121, 'name': 'Section 2', 'course_id': 2, 'nonxlist_course_id': None, 'total_students': 12}
        section_4 = {'id': 211, 'name': 'Section 1 abc', 'course_id': 4, 'nonxlist_course_id': None, 'total_students': 9}
        section_5 = {'id': 212, 'name': 'Section 2 abc', 'course_id': 4, 'nonxlist_course_id': None, 'total_students': 1}

        course1 = make_mock_course(1, 'Course 1', self.term_id, sections=[section_1, section_2])
        course2 = make_mock_course(2, 'Course 2', self.term_id, sections=[section_3])
        course3 = make_mock_course(3, 'Course 3', self.term_id, sections=[])  # no sections
        course4 = make_mock_course(4, 'Course 4', self.term_id, sections=[section_4,section_5])

        account1 = make_mock_account(10, None, courses=[course1])
        account2 = make_mock_account(20, 10, courses=[]) # subaccount
        account3 = make_mock_account(30, 15, courses=[course2,course3])  # different parent account
        account4 = make_mock_account(40, None, courses=[course4])
        account5 = make_mock_account(50, None, courses=[]) # no courses

        mock_canvas.get_accounts.return_value = [account1, account2, account3, account4, account5]
        response = self.client.get(f'{self.url}?term_id={self.term_id}&instructor_name={self.instructor_name}')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 4)

        resp_by_course_id = {c['id']: c for c in response.data}
        self.assertEqual(len(resp_by_course_id[1]['sections']), 2)
        self.assertEqual(len(resp_by_course_id[2]['sections']), 1)
        self.assertEqual(len(resp_by_course_id[3]['sections']), 0)
        self.assertEqual(len(resp_by_course_id[4]['sections']), 2)
        
        self.assertEqual(resp_by_course_id[1]['sections'][0]['id'], section_1['id'])
        self.assertEqual(resp_by_course_id[1]['sections'][1]['id'], section_2['id'])
        self.assertEqual(resp_by_course_id[2]['sections'][0]['id'], section_3['id'])
        self.assertEqual(resp_by_course_id[4]['sections'][0]['id'], section_4['id'])
        self.assertEqual(resp_by_course_id[4]['sections'][1]['id'], section_5['id'])

    @patch.object(CanvasCredentialManager, 'get_canvasapi_instance')
    def test_get_admin_sections_by_course_name_success(self, mock_get_canvasapi_instance):
        section1 = {'id': 111, 'name': 'Section 1', 'course_id': 1, 'nonxlist_course_id': None, 'total_students': 10}
        course1 = make_mock_course(1, f'{self.course_name} 1', self.term_id, sections=[section1])
        account1 = make_mock_account(10, None, courses=[course1])

        mock_canvas = mock_get_canvasapi_instance.return_value
        mock_canvas.get_accounts.return_value = [account1]
        response = self.client.get(f'{self.url}?term_id={self.term_id}&course_name={self.course_name}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], course1.id)
        self.assertEqual(len(response.data[0]['sections']), 1)
        self.assertEqual(response.data[0]['sections'][0]['id'], section1['id'])

    @patch.object(CanvasCredentialManager, 'get_canvasapi_instance')
    def test_get_admin_sections_validation_error(self, mock_get_canvasapi_instance):
        # Compose request without term_id
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn("term_id", response.data['errors'][0]['message'])
        self.assertIn("This field is required.", response.data['errors'][0]['message'])
    
    @patch.object(CanvasCredentialManager, 'get_canvasapi_instance')
    def test_get_admin_sections_no_accounts(self, mock_get_canvasapi_instance):
        mock_canvas = mock_get_canvasapi_instance.return_value
        mock_canvas.get_accounts.return_value = []

        response = self.client.get(f'{self.url}?term_id={self.term_id}&instructor_name={self.instructor_name}')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    @patch.object(CanvasCredentialManager, 'get_canvasapi_instance')
    def test_get_admin_sections_no_courses(self, mock_get_canvasapi_instance):
        mock_canvas = mock_get_canvasapi_instance.return_value
        account1 = make_mock_account(10, None, courses=[])
        mock_canvas.get_accounts.return_value = [account1]

        response = self.client.get(f'{self.url}?term_id={self.term_id}&instructor_name={self.instructor_name}')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    @patch.object(CanvasCredentialManager, 'get_canvasapi_instance')
    def test_get_admin_sections_exception_on_accounts(self, mock_get_canvasapi_instance):
        mock_canvas = mock_get_canvasapi_instance.return_value
        mock_canvas.get_accounts.side_effect = CanvasException('Canvas API error')

        response = self.client.get(f'{self.url}?term_id={self.term_id}&instructor_name={self.instructor_name}')

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        print(response.data)
        self.assertIn('Canvas API error', response.data['errors'][0]['message'])
        self.assertIn('username', response.data['errors'][0]['failedInput'])

    @patch.object(CanvasCredentialManager, 'get_canvasapi_instance')
    def test_get_admin_sections_exception_on_course(self, mock_get_canvasapi_instance):
        mock_canvas = mock_get_canvasapi_instance.return_value
        account1 = make_mock_account(10, None, courses=[], raise_exception=CanvasException('Canvas API error'))
        mock_canvas.get_accounts.return_value = [account1]

        response = self.client.get(f'{self.url}?term_id={self.term_id}&instructor_name={self.instructor_name}')
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('Canvas API error', response.data['errors'][0]['message'])
        self.assertIn('sis_login_id:jdoe', response.data['errors'][0]['failedInput'])

    @patch.object(CanvasCredentialManager, 'get_canvasapi_instance')
    def test_get_admin_sections_exception_on_sections(self, mock_get_canvasapi_instance):
        mock_canvas = mock_get_canvasapi_instance.return_value
        course1 = make_mock_course(1, 'Course 1', self.term_id, raise_exception=CanvasException('Canvas API error'))
        account1 = make_mock_account(10, None, courses=[course1])
        mock_canvas.get_accounts.return_value = [account1]

        response = self.client.get(f'{self.url}?term_id={self.term_id}&instructor_name={self.instructor_name}')
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
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data, expected_dict)

    @patch.object(CanvasCredentialManager, 'get_canvasapi_instance')
    def test_get_admin_sections_too_many_courses(self, mock_get_canvasapi_instance):
        mock_canvas = mock_get_canvasapi_instance.return_value
        courses = []
        for i in range(MAX_SEARCH_COURSES + 1):
            courses.append(make_mock_course(i, f'Course {i}', self.term_id, sections=[]))
        account1 = make_mock_account(10, None, courses=courses)
        mock_canvas.get_accounts.return_value = [account1]

        response = self.client.get(f'{self.url}?term_id={self.term_id}&instructor_name={self.instructor_name}')
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('Too many courses matched your search term; please refine your search.', response.data['errors'][0]['message'])
        self.assertIn("['sis_login_id:jdoe']", response.data['errors'][0]['failedInput'])

    @patch.object(CanvasCredentialManager, 'get_canvasapi_instance')
    def test_get_admin_sections_exact_max_courses_raises_error(self, mock_get_canvasapi_instance):
        """If the total courses returned equals MAX_SEARCH_COURSES, handler should treat it as too many and return an error."""
        mock_canvas = mock_get_canvasapi_instance.return_value
        courses = []
        # Return exactly MAX_SEARCH_COURSES to test boundary condition
        for i in range(MAX_SEARCH_COURSES):
            courses.append(make_mock_course(i, f'Course {i}', self.term_id, sections=[]))
        account1 = make_mock_account(10, None, courses=courses)
        mock_canvas.get_accounts.return_value = [account1]

        response = self.client.get(f'{self.url}?term_id={self.term_id}&instructor_name={self.instructor_name}')
        print(response.data)

        # The handler currently uses >= MAX_SEARCH_COURSES as the trigger, so equal should raise
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('Too many courses matched your search term; please refine your search.', response.data['errors'][0]['message'])
        self.assertIn("['sis_login_id:jdoe']", response.data['errors'][0]['failedInput'])

    @patch.object(CanvasCredentialManager, 'get_canvasapi_instance')
    def test_get_admin_sections_pagination_stops(self, mock_get_canvasapi_instance):
        """Ensure that islice limits consumption of the underlying iterator to MAX_SEARCH_COURSES."""
        mock_canvas = mock_get_canvasapi_instance.return_value

        counter = {'count': 0}

        def course_generator():
            # yield twice as many as the limit
            for i in range(MAX_SEARCH_COURSES * 2):
                counter['count'] += 1
                # yield a course object compatible with the handler
                yield make_mock_course(i, f'Course {i}', self.term_id, sections=[])

        account1 = make_mock_account(10, None)
        # return a fresh generator when get_courses is called
        account1.get_courses.return_value = course_generator()
        mock_canvas.get_accounts.return_value = [account1]

        response = self.client.get(f'{self.url}?term_id={self.term_id}&instructor_name={self.instructor_name}')
        

        # Handler currently raises when it sees >= MAX_SEARCH_COURSES, so expect an error response
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

        # But the underlying generator should have been advanced only up to the islice limit
        self.assertEqual(counter['count'], MAX_SEARCH_COURSES)

    @patch.object(CanvasCredentialManager, 'get_canvasapi_instance')
    def test_get_admin_sections_pagination_not_stopped(self, mock_get_canvasapi_instance):
        """If get_courses yields fewer than MAX_SEARCH_COURSES, handler returns success and
        generator is fully consumed (no premature stop)."""
        mock_canvas = mock_get_canvasapi_instance.return_value

        counter = {'count': 0}
        num_courses = MAX_SEARCH_COURSES - 1

        def course_generator():
            for i in range(num_courses):
                counter['count'] += 1
                yield make_mock_course(i, f'Course {i}', self.term_id, sections=[])

        account1 = make_mock_account(10, None)
        account1.get_courses.return_value = course_generator()
        mock_canvas.get_accounts.return_value = [account1]

        response = self.client.get(f'{self.url}?term_id={self.term_id}&instructor_name={self.instructor_name}')

        # Expect success when results are below the threshold
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # The response should include all courses returned by the generator
        self.assertEqual(len(response.data), num_courses)

        # Ensure the underlying generator was consumed exactly the number of items it yielded
        self.assertEqual(counter['count'], num_courses)

    @patch.object(CanvasCredentialManager, 'get_canvasapi_instance')
    def test_get_admin_sections_prefers_root_account(self, mock_get_canvasapi_instance):
        """If CANVAS_ROOT_ACCOUNT_ID is present in accounts, only that account should be searched."""
        mock_canvas = mock_get_canvasapi_instance.return_value

        # course belonging to root account
        root_course = make_mock_course(1001, 'Root Course', self.term_id, sections=[])
        # course belonging to another account
        other_course = make_mock_course(2002, 'Other Course', self.term_id, sections=[])

        account_root = make_mock_account(1, None, courses=[root_course])
        account_other = make_mock_account(2, None, courses=[other_course])

        mock_canvas.get_accounts.return_value = [account_root, account_other]

        response = self.client.get(f'{self.url}?term_id={self.term_id}&instructor_name={self.instructor_name}')

        # Should return only courses from the root account (id 1)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Expect only the root course to be present
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], root_course.id)

    @patch.object(CanvasCredentialManager, 'get_canvasapi_instance')
    def test_get_admin_sections_preserves_multiple_accounts(self, mock_get_canvasapi_instance):
        """When multiple non-root accounts are accessible, courses from all accounts are returned."""
        mock_canvas = mock_get_canvasapi_instance.return_value

        # courses for two different non-root accounts
        course_a = make_mock_course(1231, 'Course A', self.term_id, sections=[])
        course_b = make_mock_course(2342, 'Course B', self.term_id, sections=[])

        account_a = make_mock_account(123, None, courses=[course_a])
        account_b = make_mock_account(234, None, courses=[course_b])

        mock_canvas.get_accounts.return_value = [account_a, account_b]

        response = self.client.get(f'{self.url}?term_id={self.term_id}&instructor_name={self.instructor_name}')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # both courses from both accounts should be present
        returned_ids = {c['id'] for c in response.data}
        self.assertIn(course_a.id, returned_ids)
        self.assertIn(course_b.id, returned_ids)
        self.assertEqual(len(response.data), 2)

    def test_check_dups_error_only_duplicates_removed(self):
        """Ensure _check_dups_error removes only duplicated HTTPAPIError entries and preserves distinct ones."""
        handler = CanvasAdminSectionsAPIHandler()

        dup_message = 'Too many courses matched your search term; please refine your search.'
        errors = [
            HTTPAPIError('001', Exception(dup_message)),
            HTTPAPIError('001', Exception(dup_message)),
            HTTPAPIError('test', ResourceDoesNotExist('Not Found')),
        ]

        deduped = handler._check_dups_error(errors)

        # Duplicates should be removed, leaving 2 unique errors
        self.assertEqual(len(deduped), 2)
        failed_inputs = {e.failed_input for e in deduped}
        self.assertIn('001', failed_inputs)
        self.assertIn('test', failed_inputs)

    @patch.object(CanvasCredentialManager, 'get_canvasapi_instance')
    def test_too_many_single_account_triggers_account_level(self, mock_get_canvasapi_instance):
        """A single account yielding >= MAX_SEARCH_COURSES should trigger the per-account limit path.
        We validate this by using a generator and asserting it was advanced up to the islice limit.
        """
        mock_canvas = mock_get_canvasapi_instance.return_value

        counter = {'count': 0}

        def gen_courses():
            # yield a lot (>= MAX_SEARCH_COURSES) so the handler's islice will cut at MAX_SEARCH_COURSES
            for i in range(MAX_SEARCH_COURSES * 2):
                counter['count'] += 1
                yield make_mock_course(i, f'Course {i}', self.term_id, sections=[])

        account1 = make_mock_account(10, None)
        account1.get_courses.return_value = gen_courses()
        mock_canvas.get_accounts.return_value = [account1]

        response = self.client.get(f'{self.url}?term_id={self.term_id}&instructor_name={self.instructor_name}')

        # per-account path raises when a single account produces >= MAX_SEARCH_COURSES
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        # ensure the underlying generator was only advanced up to the islice limit
        self.assertEqual(counter['count'], MAX_SEARCH_COURSES)

    @patch.object(CanvasCredentialManager, 'get_canvasapi_instance')
    def test_too_many_across_multiple_accounts_triggers_top_level(self, mock_get_canvasapi_instance):
        """Multiple accounts whose combined course counts reach >= MAX_SEARCH_COURSES should trigger the top-level check
        (no single account reaches the per-account threshold).
        """
        mock_canvas = mock_get_canvasapi_instance.return_value

        # create several accounts each with fewer than MAX_SEARCH_COURSES courses
        per_account = MAX_SEARCH_COURSES // 4
        accounts = []
        total = 0
        for aid in range(5):
            courses = []
            for i in range(per_account):
                courses.append(make_mock_course(aid * 1000 + i, f'Course {i}', self.term_id, sections=[]))
                total += 1
            accounts.append(make_mock_account(100 + aid, None, courses=courses))

        # ensure combined total >= MAX_SEARCH_COURSES
        self.assertTrue(total >= MAX_SEARCH_COURSES)
        mock_canvas.get_accounts.return_value = accounts

        response = self.client.get(f'{self.url}?term_id={self.term_id}&instructor_name={self.instructor_name}')

        # top-level triggers error when accumulated courses reach the threshold
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        # In this scenario no single account should have been advanced to MAX_SEARCH_COURSES by islice
        # (we used lists so there are no generator counters); success here is the handler returning the error

    @patch.object(CanvasCredentialManager, 'get_canvasapi_instance')
    def test_duplicate_too_many_errors_are_deduplicated(self, mock_get_canvasapi_instance):
        """If two accounts raise identical HTTPAPIError (same failed_input and message), the handler should dedupe them and return a single error."""
        mock_canvas = mock_get_canvasapi_instance.return_value

        def gen_courses():
            for i in range(MAX_SEARCH_COURSES):
                yield make_mock_course(i, f'Course {i}', self.term_id, sections=[])

        account1 = make_mock_account(10, None)
        account1.get_courses.return_value = gen_courses()
        account2 = make_mock_account(20, None)
        account2.get_courses.return_value = gen_courses()

        mock_canvas.get_accounts.return_value = [account1, account2]

        response = self.client.get(f'{self.url}?term_id={self.term_id}&instructor_name={self.instructor_name}')

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        # errors should be deduplicated to 1
        self.assertEqual(len(response.data['errors']), 1)
        self.assertIn('Too many courses matched your search term; please refine your search.', response.data['errors'][0]['message'])