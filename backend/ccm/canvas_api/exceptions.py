import logging
import json
from http import HTTPStatus
from typing import List, Union
from canvasapi.exceptions import (
    BadRequest, Conflict, Forbidden, InvalidAccessToken, RateLimitExceeded,
    ResourceDoesNotExist, Unauthorized, UnprocessableEntity
)

from canvas_oauth.exceptions import InvalidOAuthReturnError
from rest_framework.exceptions import APIException
from backend.ccm.canvas_api.constants import INSUFFICIENT_SCOPES_ON_ACCESS_TOKEN

logger = logging.getLogger(__name__)

class HTTPAPIError(Exception):
    """Custom exception to capture failed input along with the error details."""
    def __init__(self, failed_input: str, original_exception: Exception):
        self.failed_input = failed_input
        self.original_exception = original_exception

    def to_dict(self) -> dict:
        """Returns a dictionary representation of the error."""
        return {"failed_input": self.failed_input, "error": self.original_exception}

class CanvasErrorHandler():
    """
    Custom exception for HTTP errors originating from Canvas API interactions
    """

    canvas_error_prefix = 'An error occurred during Canvas API steps. '

    EXCEPTION_STATUS_MAP = {
        BadRequest: HTTPStatus.BAD_REQUEST.value,
        InvalidAccessToken: HTTPStatus.UNAUTHORIZED.value,
        Unauthorized: HTTPStatus.UNAUTHORIZED.value,
        Forbidden: HTTPStatus.FORBIDDEN.value,
        RateLimitExceeded: HTTPStatus.FORBIDDEN.value,
        ResourceDoesNotExist: HTTPStatus.NOT_FOUND.value,
        UnprocessableEntity: HTTPStatus.UNPROCESSABLE_ENTITY.value,
        Conflict: HTTPStatus.CONFLICT.value,
        InvalidOAuthReturnError: HTTPStatus.FORBIDDEN.value
    }

    def __init__(self) -> None:
        self.errors = []
        self.create_user_error = {}
    
    def handle_serializer_errors(self, serializer_errors: dict, input: str):
      logger.error(f"Serializer error: {serializer_errors} occured during the API call.")
      # Create a SerializerError instance and pass it to CanvasHTTPError
      self.errors.append({
                "canvasStatusCode": HTTPStatus.INTERNAL_SERVER_ERROR.value,
                "message": str(serializer_errors),
                "failedInput": input
            })
    def django_q_task_error(self, error: Exception, input: str):
        """
        Handle errors that occur during Django Q task execution.
        """
        logger.error(f"Error in Django Q task '{input}': {error}")
        self.errors.append({
            "canvasStatusCode": HTTPStatus.INTERNAL_SERVER_ERROR.value,
            "message": str(error),
            "failedInput": input
        })
    
    def handle_canvas_api_exceptions(self, exceptions: Union[HTTPAPIError, List[HTTPAPIError]]):
        logger.error(f"API error occurred: {exceptions}")
        exceptions = exceptions if isinstance(exceptions, list) else [exceptions]
        
        
        # Handle access token-related issues
        for exc in exceptions:
            if isinstance(exc.original_exception, InvalidAccessToken):
                raise CanvasAccessTokenException()

            if isinstance(exc.original_exception, Unauthorized) and INSUFFICIENT_SCOPES_ON_ACCESS_TOKEN in str(exc.original_exception).lower():
                raise CanvasAccessTokenException()
        
        if all(isinstance(error, HTTPAPIError) for error in exceptions):
            for error in exceptions:
                self.errors.append({
                    "canvasStatusCode": self.EXCEPTION_STATUS_MAP.get(type(error.original_exception), HTTPStatus.INTERNAL_SERVER_ERROR.value),
                    "message": str(error.original_exception),
                    "failedInput": error.failed_input
                })

    def handle_create_user_canvas_api_exception(self, exception: HTTPAPIError):
        return {
            "canvasStatusCode": self.EXCEPTION_STATUS_MAP.get(type(exception), HTTPStatus.INTERNAL_SERVER_ERROR.value),
            "message": str(exception.original_exception),
            "failedInput": exception.failed_input
        }
    
    
    def is_canvas_user_created(self, error: HTTPAPIError) -> bool:
        """
        This method checks whether the error message indicates the user is already created.
        Sample json:
        {"errors":{"user":{"pseudonyms":[{"attribute":"pseudonyms","message":"is invalid","type":"invalid"}]},
        "pseudonym":{"unique_id":[{"attribute":"unique_id","message":"ID already in use for this account and authentication provider","type":"taken"}]},
        "observee":{},"pairing_code":{},"recaptcha":null}}

        """
        if isinstance(error.original_exception, BadRequest):
            try:
                error_json_str = str(error.original_exception)
                error_dict = json.loads(error_json_str)
            except json.JSONDecodeError:
                error_dict = {}
            unique_id_errors = error_dict.get("errors", {}) \
                                        .get("pseudonym", {}) \
                                        .get("unique_id", [])
            return any(err.get("type") == "taken" for err in unique_id_errors)
        return False

    def to_dict(self) -> dict:
        return {
            "statusCode": (sc.pop() if len(sc := {e["canvasStatusCode"] for e in self.errors}) == 1 else HTTPStatus.INTERNAL_SERVER_ERROR.value),
            "errors": self.errors
        }
    
class CanvasAccessTokenException(APIException):
    """
    Custom exception for Canvas token-related errors.
    """
    status_code = 401
    default_detail = 'Unauthorized'
    default_code = 'unauthorized'

    def __init__(self, detail=None, code=None):
        self.redirect = True
        super().__init__(detail or self.default_detail, code)

    def to_dict(self) -> dict:
        return {
            "message": self.detail,
            "statusCode": self.status_code,
            "redirect": self.redirect
        }

class ExternalUserCreationAndInvitationErrorHandler():
    """
    Custom exception for errors occurring during the creation and invitation of external users.
    """
    def __init__(self) -> None:
        super().__init__()
    
    def determine_status_code(self, external_user_success_failure_resp: list[dict]) -> int:
        """
        The method determines the appropriate status code based mixed the success or failure
        of external user creation and invitation.
        params:
            external_user_success_failure_resp: A list of dictionaries containing the success
            or failure information for each external user.
        """
        codes = []
        for user_obj in external_user_success_failure_resp:
            if isinstance(user_obj.get("userCreated"), dict) and "canvasStatusCode" in user_obj["userCreated"]:
                codes.append(user_obj["userCreated"]["canvasStatusCode"])
            if isinstance(user_obj.get("invited"), dict) and "statusCode" in user_obj["invited"]:
                codes.append(user_obj["invited"]["statusCode"])
        unique_status_codes = set(codes)
        if not codes:
            return HTTPStatus.INTERNAL_SERVER_ERROR.value
        return HTTPStatus.BAD_GATEWAY.value if len(unique_status_codes) > 1 else list(unique_status_codes)[0]
    
    def is_creation_invitation_all_success(self, user_obj: dict) -> bool:
        """
        Here the method checks if both user creation and invitation were successful.
        already existing user is treated as a success.
        params:
            user_obj: A dictionary containing the user creation and invitation information.
        """
        if isinstance(user_obj.get("userCreated"), dict):
            if "canvasStatusCode" in user_obj["userCreated"]:
                return True
        if isinstance(user_obj.get("invited"), dict):
            if "statusCode" in user_obj["invited"]:
                return True
        return False