import logging
from dataclasses import dataclass
from http import HTTPStatus
from typing import List, Union
from canvasapi.exceptions import (
    BadRequest, Conflict, Forbidden, InvalidAccessToken, RateLimitExceeded,
    ResourceDoesNotExist, Unauthorized, UnprocessableEntity
)
from canvas_oauth.exceptions import InvalidOAuthReturnError
from rest_framework.exceptions import APIException

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

    INSUFFICIENT_SCOPES_TEXT = 'insufficient scopes on access token'

    def __init__(self) -> None:
        self.errors = []
    
    def handle_serializer_errors(self, serializer_errors: dict, input: str):
      logger.error(f"Serializer error: {serializer_errors} occured during the API call.")
      # Create a SerializerError instance and pass it to CanvasHTTPError
      self.errors.append({
                "canvasStatusCode": HTTPStatus.INTERNAL_SERVER_ERROR.value,
                "message": str(serializer_errors),
                "failedInput": input
            })
    
    def handle_canvas_api_exceptions(self, exceptions: Union[HTTPAPIError, List[HTTPAPIError]]):
        logger.error(f"API error occurred: {exceptions}")
        exceptions = exceptions if isinstance(exceptions, list) else [exceptions]
        
        
        # Handle access token-related issues
        for exc in exceptions:
            if isinstance(exc.original_exception, InvalidAccessToken):
                raise CanvasAccessTokenException()

            if isinstance(exc.original_exception, Unauthorized) and self.INSUFFICIENT_SCOPES_TEXT in str(exc.original_exception).lower():
                raise CanvasAccessTokenException()
        
        if all(isinstance(error, HTTPAPIError) for error in exceptions):
            for error in exceptions:
                self.errors.append({
                    "canvasStatusCode": self.EXCEPTION_STATUS_MAP.get(type(error.original_exception), HTTPStatus.INTERNAL_SERVER_ERROR.value),
                    "message": str(error.original_exception),
                    "failedInput": error.failed_input
                })

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