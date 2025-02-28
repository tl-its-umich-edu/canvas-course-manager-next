import json
from typing import Any, List, TypedDict


class StandardCanvasErrorData(TypedDict):
    message: str


class CanvasHTTPErrorData(TypedDict):
    status_code: int
    message: str
    
class CanvasHTTPError(Exception):
    """
    Custom exception for HTTP errors originating from Canvas API interactions
    """

    canvas_error_prefix = 'An error occurred while communicating with Canvas. '

    message: str
    status_code: int
    errors: List[dict]

    def __init__(self, error_data: Any, status_code: int, failed_input: str = None) -> None:
        self.errors = []
        if (
            isinstance(error_data, list) and
            all([isinstance(obj, dict) for obj in error_data]) and
            all(['message' in obj for obj in error_data]) and
            all([isinstance(obj['message'], str) for obj in error_data])
        ):
            canvas_error_data: List[StandardCanvasErrorData] = error_data
            for error in canvas_error_data:
                self.errors.append({
                    "canvasStatusCode": status_code,
                    "message": error['message'],
                    "failedInput": failed_input
                })
        elif isinstance(error_data, str):
            self.errors.append({
                "canvasStatusCode": status_code,
                "message": error_data,
                "failedInput": failed_input
            })
        else:
            self.errors.append({
                "canvasStatusCode": status_code,
                "message": f'Non-standard data shape found: {json.dumps(error_data)}',
                "failedInput": failed_input
            })

        self.status_code = status_code

    def __str__(self) -> str:
        return f'Status code: {self.status_code}; Errors: {self.errors}'

    def to_dict(self) -> dict:
        return {
            "statusCode": self.status_code,
            "errors": self.errors
        }