import logging
import asyncio
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
from canvasapi.exceptions import CanvasException
from backend.ccm.canvas_api.canvas_credential_manager import CanvasCredentialManager
from backend.ccm.canvas_api.canvasapi_serializer import CanvasObjectROSerializer, ExternalUsersRequestSerializer
from .exceptions import CanvasErrorHandler, HTTPAPIError, ExternalUserCreationAndInvitationErrorHandler
from backend.ccm.canvas_api.constants import CANVAS_ROOT_ACCOUNT_ID, MAX_CONCURRENCY
from django_q.tasks import async_task
from backend.ccm.utils import timeit


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
      self.external_user_error = ExternalUserCreationAndInvitationErrorHandler()
      self.allowed_fields = ['id', 'name']
      super().__init__()
    
    @timeit
    def post(self, request: Request) -> Response:
        # Validate external users payload
        serializer = ExternalUsersRequestSerializer(data=request.data)
        if not serializer.is_valid():
            self.canvas_error.handle_serializer_errors(serializer.errors, str(request.data))
            return Response(self.canvas_error.to_dict(), status=self.canvas_error.to_dict().get('statusCode'))

        users = serializer.validated_data.get('users', [])
        results = self.create_users(users)
        logger.info(f"Results external user: {results}")

        external_user_response_outcome, new_user_email_invitation_list = self.process_user_creation_outcomes(users, results)

        if new_user_email_invitation_list:
            self.add_invitation_status_to_users(external_user_response_outcome, new_user_email_invitation_list)

        if not any(self.external_user_error.is_creation_invitation_all_success(user_resp) for user_resp in external_user_response_outcome):
            return Response(external_user_response_outcome, status=HTTPStatus.OK)
        else:
            status_code = self.external_user_error.determine_status_code(external_user_response_outcome)
            return Response({
                "statusCode": status_code,
                "data": external_user_response_outcome
            }, status=status_code)
    
    def add_invitation_status_to_users(self, external_user_response_outcome: list[dict], new_user_email_invitation_list: list[str]) -> None:
        """
        Adds the 'invited' field to users with userCreated=True based on invitation results.
        """
        invitation_results: bool | Exception = self.isExternalUsersInvitationSuccess(new_user_email_invitation_list)
        for user_data in external_user_response_outcome:
            if user_data.get('userCreated') is True:
                if isinstance(invitation_results, Exception):
                    user_data['invited'] = {"statusCode": HTTPStatus.INTERNAL_SERVER_ERROR, 'messages': [str(invitation_results)]}
                else:
                    user_data['invited'] = invitation_results
    
    # Transform results to ExternalUserData objects
    def process_user_creation_outcomes(self, users: list[ExternalUserDict], results: list[object]) -> tuple[list[dict], list[str]]:
        """
        Processes the results of user creation attempts and returns:
        - external_user_data: list of dicts with user creation status
        - new_user_email_invitation_list: list of emails for successfully created users
        """
        external_user_data = []
        new_user_email_invitation_list = []
        for user, result in zip(users, results):
            if isinstance(result, dict):
                # Add to invitation list if created successfully
                new_user_email_invitation_list.append(user['email'])
                external_user_data.append({
                    'email': user['email'],
                    'userCreated': True
                })
            elif isinstance(result, HTTPAPIError):
                is_user_created = self.canvas_error.is_canvas_user_created(result)
                # If user already exists, userCreated should be False, and do not include 'invited'
                external_user_data.append({
                    'email': user['email'],
                    'userCreated': False if is_user_created else self.canvas_error.handle_create_user_canvas_api_exception(result)
                })
        return external_user_data, new_user_email_invitation_list

    def isExternalUsersInvitationSuccess(self, new_user_email_invitation_list: List[str]) -> bool | Exception:
        """
        The users who got successfully created is sent out an email invitation. This is run as
        background task. This can handle bulk sending email based on the request received
        """
        timestamp = datetime.now().strftime('%Y/%m/%d-%H:%M:%S-%f')
        task_name = f'external-user-email-{len(new_user_email_invitation_list)}-{timestamp}'
        try:
          email_task_id = async_task('backend.ccm.background_tasks.send_email_non_umich_user_task.sending_emails', 
                                    task_params=new_user_email_invitation_list, task_name=task_name)
          logger.info(f"Async task for email sending initiated with task ID: {email_task_id}")
          return True
        except Exception as e:
            logger.error(f"Failed to initiate email sending task: {e}")
            return e


    @async_to_sync
    async def create_users(self, users: List[ExternalUserDict]):
        tasks = [self.sem_task(user) for user in users]
        return await asyncio.gather(*tasks, return_exceptions=True)

    async def sem_task(self, user: ExternalUserDict):
        semaphore = asyncio.Semaphore(int(MAX_CONCURRENCY + 2))
        try:
            async with semaphore:
                return await asyncio.to_thread(self.create_user_sync, user)
        except Exception as e:
            logger.error(f"Error in sem_task {user['email']}: {e}")
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
            raise HTTPAPIError(loginId, e)

