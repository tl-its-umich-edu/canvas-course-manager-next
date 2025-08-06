from django.test import SimpleTestCase
from backend.ccm.canvas_api.enroll_users import process_login_id

class TestProcessLoginId(SimpleTestCase):
    def test_umich_edu(self):
        self.assertEqual(process_login_id("student@umich.edu"), "student")

    def test_med_umich_edu(self):
        self.assertEqual(process_login_id("student@med.umich.edu"), "student")

    def test_gmail(self):
        self.assertEqual(process_login_id("student@gmail.com"), "student+gmail.com")

    def test_eecs_umich_edu_upper(self):
        self.assertEqual(process_login_id("professor@eecs.UMICH.EDU"), "professor")

    def test_simple(self):
        self.assertEqual(process_login_id("student"), "student")
