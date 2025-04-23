from django.test import SimpleTestCase
from backend.ccm.canvas_api.exceptions import CanvasErrorHandler, HTTPAPIError
from canvasapi.exceptions import (BadRequest, Unauthorized, InvalidAccessToken, Forbidden)
from backend.ccm.canvas_api.exceptions import CanvasAccessTokenException

class TestCanvasHTTPError(SimpleTestCase):

    def test_canvas_error_case(self):
        err_message = '{"errors":{"name":[{"attribute":"name","message":"is too long (maximum is 255 characters)","type":"too_long"}],"course_code":[{"attribute":"course_code","message":"is too long (maximum is 255 characters)","type":"too_long"}]}'
        error_data = [
            HTTPAPIError(
                failed_input="403334",
                original_exception=BadRequest(err_message)
            )
        ]
        error = CanvasErrorHandler()
        error.handle_canvas_api_exceptions(error_data)
        
        expected_dict = {
            "statusCode": 400,  # Default status code since Exception isn't in EXCEPTION_STATUS_MAP
            "errors": [
                {
                    "canvasStatusCode": 400,
                    "message": err_message,
                    "failedInput": "403334"
                }
            ]
        }
        self.assertEqual(error.to_dict(), expected_dict)

    def test_serializer_error(self):
        failed_input="2020202020202020202"
        serializer_error={"error": "The Resource does not exist."}
        error = CanvasErrorHandler()
        error.handle_serializer_errors(serializer_error, failed_input)
        
        self.assertEqual(len(error.errors), 1)
        self.assertEqual(error.errors[0]["message"], str({"error": "The Resource does not exist."}))
        self.assertEqual(error.errors[0]["failedInput"], "2020202020202020202")
        expected_dict = {
            "statusCode": 500,
            "errors": [
                {
                    "canvasStatusCode": 500,
                    "message": "{'error': 'The Resource does not exist.'}",
                    "failedInput": "2020202020202020202"
                }
            ]
        }
        self.assertEqual(error.to_dict(), expected_dict)

    def test_invalid_access_token_exception(self):
        error_data = [
            HTTPAPIError(
                failed_input="invalid_token",
                original_exception=InvalidAccessToken({'errors': [{'message': 'Revoked access token.'}]})
            )
        ]
        error = CanvasErrorHandler()

        with self.assertRaises(CanvasAccessTokenException):
            error.handle_canvas_api_exceptions(error_data)
    
    def test_insuffient_scopes_on_access_token_exception(self):
        error_data = [
            HTTPAPIError(
                failed_input="invalid_token",
                original_exception=Unauthorized({'errors': [{'message': 'Insufficient scopes on access token.'}], 'error_report_id': 7032522713})
            )
        ]
        error = CanvasErrorHandler()

        with self.assertRaises(CanvasAccessTokenException):
            error.handle_canvas_api_exceptions(error_data)
    
    def test_Unauthorized_exception(self):
        error_message = '{"errors": [{"message": "you do not have sufficient privilege"}]}'
        error_data = [
            HTTPAPIError(
                failed_input="invalid_token",
                original_exception=Unauthorized(error_message)
            )
        ]
        error = CanvasErrorHandler()
        error.handle_canvas_api_exceptions(error_data)

        expected_dict = {
            "statusCode": 401,
            "errors": [
                {
                    "canvasStatusCode": 401,
                    "message": error_message,
                    "failedInput": "invalid_token"
                }
            ]
        }
        self.assertEqual(error.to_dict(), expected_dict)

    def test_multiple_http_api_errors_with_invalid_access_token(self):
        error_data = [
            HTTPAPIError(
                failed_input="input_1",
                original_exception=BadRequest("Bad request error")
            ),
            HTTPAPIError(
                failed_input="input_2",
                original_exception=Forbidden("Forbidden error")
            ),
            HTTPAPIError(
                failed_input="input_3",
                original_exception=InvalidAccessToken("Invalid access token error")
            )
        ]
        error = CanvasErrorHandler()

        with self.assertRaises(CanvasAccessTokenException):
            error.handle_canvas_api_exceptions(error_data)


