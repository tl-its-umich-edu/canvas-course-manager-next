import logging
import asyncio
import time
from datetime import timedelta
from http import HTTPStatus
from datetime import datetime
from rest_framework.views import APIView
from rest_framework_tracking.mixins import LoggingMixin
from rest_framework import authentication, permissions
from rest_framework.request import Request
from rest_framework.response import Response
from typing import TypedDict, List
from canvasapi import Canvas
from asgiref.sync import async_to_sync
from canvasapi.exceptions import CanvasException, BadRequest
from backend.ccm.canvas_api.canvas_credential_manager import CanvasCredentialManager
from backend.ccm.canvas_api.canvasapi_serializer import CanvasObjectROSerializer, LoginIdSerializer, ExternalUsersRequestSerializer
from .exceptions import CanvasErrorHandler, HTTPAPIError
from backend.ccm.canvas_api.constants import CANVAS_ROOT_ACCOUNT_ID, MAX_CONCURRENCY
from django_q.tasks import async_task
import json


logger = logging.getLogger(__name__)

class ExternalUserDict(TypedDict):
    email: str
    givenName: str
    surname: str

class CanvasCreateUserHandler(LoggingMixin, APIView):
    logging_methods = ['GET']
    authentication_classes = [authentication.SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ExternalUsersRequestSerializer

    def __init__(self, credential_manager=None):
      self.credential_manager = credential_manager or CanvasCredentialManager()
      self.canvas_error = CanvasErrorHandler()
      self.allowed_fields = ['id', 'name']
      super().__init__()
    
    def post(self, request: Request) -> Response:
        # Validate external users payload
        serializer = ExternalUsersRequestSerializer(data=request.data)
        if not serializer.is_valid():
            self.canvas_error.handle_serializer_errors(serializer.errors, str(request.data))
            return Response(self.canvas_error.to_dict(), status=self.canvas_error.to_dict().get('statusCode'))

        users = serializer.validated_data.get('users', [])
        start_time: float = time.perf_counter()
        results = self.create_users(users)
        end_time: float = time.perf_counter()

        # Transform results to ExternalUserData objects
        external_user_data = []
        new_user_email_invitation_list = []
        for user, result in zip(users, results):
            if isinstance(result, dict):
                external_user_data.append({
                    'email': user['email'],
                    'userCreated': True,
                    'invited': True
                })
                # Add to invitation list if created successfully
                new_user_email_invitation_list.append(user['email'])
            elif isinstance(result, Exception):
                is_taken = self._is_unique_id_taken(result)
                external_user_data.append({
                    'email': user['email'],
                    'userCreated': is_taken
                })

        logger.info(f"Creating User: {len(users)} Users took about {timedelta(seconds=(end_time - start_time))}")

        #mocking the email workflow
        timestamp = datetime.now().strftime('%Y/%m/%d-%H:%M:%S-%f')
        task_name = f'external-user-email-{len(users)}-{timestamp}'
        email_task_id = async_task('backend.ccm.background_tasks.send_email_non_umich_user_task.sending_emails', task_params=new_user_email_invitation_list, task_name=task_name)
        logger.info(f"Async task for email sending initiated with task ID: {email_task_id}")

        return Response(external_user_data, status=HTTPStatus.OK)

    def _is_unique_id_taken(self, error: Exception) -> bool:
        if isinstance(error, BadRequest):
            try:
                error_dict = json.loads(getattr(error, 'message', '{}'))
            except json.JSONDecodeError:
                error_dict = {}
            unique_id_errors = error_dict.get("errors", {}) \
                                        .get("pseudonym", {}) \
                                        .get("unique_id", [])
            return any(err.get("type") == "taken" for err in unique_id_errors)
        return False
    
    async def sem_task(self, semaphore, user: ExternalUserDict):
        async with semaphore:
            return await self.create_user(user)

    @async_to_sync
    async def create_users(self, users: List[ExternalUserDict]):
        max_concurrent = int(MAX_CONCURRENCY + 2)
        semaphore = asyncio.Semaphore(max_concurrent)
        tasks = [self.sem_task(semaphore, user) for user in users]
        return await asyncio.gather(*tasks, return_exceptions=True)

    async def create_user(self, user: ExternalUserDict):
        try:
            return await asyncio.to_thread(self.create_user_sync, user)
            # return self.create_user_sync(user)
        except Exception as e:
            logger.error(f"Error create_user {user['email']}: {e}")
            return e

    def create_user_sync(self, user: ExternalUserDict):
        canvas_api: Canvas = self.credential_manager.get_canvasapi_admin_instance()

        loginId: str = user['email'].replace('@', '+')  # Create a unique login ID
        fullName: str = f'{user["givenName"]} {user["surname"]}'
        sortableName: str = f'{user["surname"]} {user["givenName"]}'
        email: str = user['email']

        try:
            created_user = canvas_api.get_account(CANVAS_ROOT_ACCOUNT_ID).create_user(
                user={
                    'name': fullName,
                    'sortable_name': sortableName,
                    'skip_registration': True,
                },
                pseudonym={
                    'unique_id': loginId,
                    'send_confirmation': False
                },
                communication_channel={
                    'type': 'email',
                    'address': email,
                    'skip_confirmation': True
                },
                force_validations=False
            )
            append_fields = {'login_id': loginId, 'email': email}
            serializer = CanvasObjectROSerializer(created_user, allowed_fields=self.allowed_fields, append_fields=append_fields)
            return serializer.data
        except (CanvasException, Exception) as e:
            logger.error(f"Error create_user_sync {loginId}: {e}")
            raise e

