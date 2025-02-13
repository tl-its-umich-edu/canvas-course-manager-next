from django.test import SimpleTestCase
from backend.ccm.canvas_api.exceptions import CanvasHTTPError
from rest_framework.exceptions import ErrorDetail

class TestCanvasHTTPError(SimpleTestCase):

    def test_list_error_data(self):
        error_data = [{'message': 'Revoked access token.'}]
        status_code = 401
        failed_input = "403334"
        error = CanvasHTTPError(error_data, status_code, failed_input)
        
        self.assertEqual(error.status_code, status_code)
        self.assertEqual(len(error.errors), 1)
        self.assertEqual(error.errors[0]["message"], "Revoked access token.")
        self.assertEqual(error.errors[0]["failedInput"], failed_input)
        expected_dict = {
            "statusCode": 401,
            "errors": [
            {
                "canvasStatusCode": 401,
                "message": "Revoked access token.",
                "failedInput": "403334"
            }
            ]
        }
        self.assertEqual(error.to_dict(), expected_dict)

    def test_string_error_data(self):
        error_data = "The Resource does not exist."
        status_code = 500
        failed_input = "2020202020202020202"
        error = CanvasHTTPError(error_data, status_code, failed_input)
        
        self.assertEqual(error.status_code, status_code)
        self.assertEqual(len(error.errors), 1)
        self.assertEqual(error.errors[0]["message"], error_data)
        self.assertEqual(error.errors[0]["failedInput"], failed_input)
        expected_dict = {
            "statusCode": 500,
            "errors": [
            {
                "canvasStatusCode": 500,
                "message": "The Resource does not exist.",
                "failedInput": "2020202020202020202"
            }
            ]
        }
        self.assertEqual(error.to_dict(), expected_dict)

    def test_non_standard_error_data(self):

        error_data = {'newName': [ErrorDetail(string='This field is required.', code='required')]} # type: ignore
        status_code = 404
        failed_input = "{'newNames': 'CCM Test Course'}"
        error = CanvasHTTPError(error_data, status_code, failed_input)
        
        self.assertEqual(error.status_code, status_code)
        self.assertEqual(len(error.errors), 1)
        self.assertIn("Non-standard data shape found", error.errors[0]["message"])
        self.assertEqual(error.errors[0]["failedInput"], failed_input)

