from django.test import SimpleTestCase
from backend.ccm.canvas_api import constants

class TestConstants(SimpleTestCase):
    def test_role_to_enrollment_type_mapping_for_some_roles(self):
        # Check a few roles map to the correct enrollment type
        self.assertEqual(constants.ROLE_TO_ENROLLMENT_TYPE["student"], "StudentEnrollment")
        self.assertEqual(constants.ROLE_TO_ENROLLMENT_TYPE["teacher"], "TeacherEnrollment")
        self.assertEqual(constants.ROLE_TO_ENROLLMENT_TYPE["ta"], "TaEnrollment")
        self.assertEqual(constants.ROLE_TO_ENROLLMENT_TYPE["observer"], "ObserverEnrollment")
        self.assertEqual(constants.ROLE_TO_ENROLLMENT_TYPE["designer"], "DesignerEnrollment")

    def test_allowed_roles_are_expected(self):
        # Ensure allowed roles match the expected set
        expected_roles = (
            "student",
            "teacher",
            "ta",
            "observer",
            "designer",
            "assistant",
            "librarian",
        )
        self.assertEqual(tuple(constants.ALLOWED_ROLES), expected_roles)

    def test_role_to_enrollment_type_keys_are_expected(self):
        # ROLE_TO_ENROLLMENT_TYPE keys should match expected roles
        expected_keys = (
            "student",
            "teacher",
            "ta",
            "observer",
            "designer",
        )
        self.assertEqual(tuple(constants.ROLE_TO_ENROLLMENT_TYPE.keys()), expected_keys)

    def test_role_to_enrollment_type_values(self):
        # ROLE_TO_ENROLLMENT_TYPE values should match expected enrollment types
        expected_values = (
            "StudentEnrollment",
            "TeacherEnrollment",
            "TaEnrollment",
            "ObserverEnrollment",
            "DesignerEnrollment",
        )
        self.assertEqual(tuple(constants.ROLE_TO_ENROLLMENT_TYPE.values()), expected_values)

    def test_assistant_and_librarian_not_in_role_to_enrollment_type(self):
        # These should not be in the mapping
        self.assertNotIn("assistant", constants.ROLE_TO_ENROLLMENT_TYPE)
        self.assertNotIn("librarian", constants.ROLE_TO_ENROLLMENT_TYPE)
