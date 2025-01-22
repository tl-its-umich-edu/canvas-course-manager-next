from uuid import uuid4, UUID
from django.core.management import call_command
from django.test import SimpleTestCase
from unittest.mock import patch, MagicMock
from typing import Any

class ManageLtiKeyCommandTest(SimpleTestCase):

    def setUp(self) -> None:
        self.id: int = 1
        self.name: str = "Test Registration"
        self.issuer: str = "https://canvas.test.instructure.com"
        self.client_id: int = 12345
        self.auth_url_root: str = "https://sso.test.canvaslms.com"
        self.deployment_id: str = "test-deployment-id"
        self.uuid: UUID = uuid4()

        self.mock_registration: MagicMock = MagicMock()
        self.mock_registration.id = self.id
        self.mock_registration.name = self.name
        self.mock_registration.issuer = self.issuer
        self.mock_registration.client_id = self.client_id
        self.mock_registration.auth_url = f"{self.auth_url_root}/api/lti/authorize_redirect"
        self.mock_registration.token_url = f"{self.auth_url_root}/login/oauth2/token"
        self.mock_registration.keyset_url = f"{self.auth_url_root}/api/lti/security/jwks"
        self.mock_registration.uuid = self.uuid

        self.mock_deployment: MagicMock = MagicMock()
        self.mock_deployment.deployment_id = self.deployment_id
        self.mock_deployment.is_active = True
        self.mock_deployment.registration = self.mock_registration
        return super().setUp()
    
    @patch('lti_tool.models.LtiRegistration.objects.create')
    @patch('lti_tool.models.LtiDeployment.objects.create')
    def test_add_lti_key(self, mock_lti_deployment_create: MagicMock, mock_lti_registration_create: MagicMock) -> None:

        args_create: list[str] = [
            '--action', 'create',
            '--name', self.name,
            '--client_id', str(self.client_id),
            '--deployment_id', self.deployment_id,
        ]

        mock_lti_registration_create.return_value = self.mock_registration
        mock_lti_deployment_create.return_value = self.mock_deployment

        call_command('manage_lti_key', *args_create)

        mock_lti_registration_create.assert_called_once_with(
            name=self.name,
            issuer=self.issuer,
            client_id=self.client_id,
            auth_url=f"{self.auth_url_root}/api/lti/authorize_redirect",
            token_url=f"{self.auth_url_root}/login/oauth2/token",
            keyset_url=f"{self.auth_url_root}/api/lti/security/jwks",
        )
        mock_lti_deployment_create.assert_called_once_with(
            registration=self.mock_registration,
            deployment_id=self.deployment_id,
            is_active=True
        )

    @patch('lti_tool.models.LtiRegistration.objects.get')
    def test_get_lti_key(self, mock_lti_registration_get: MagicMock) -> None:

        args_get: list[str] = [
            '--action', 'get',
            '--client_id', str(self.client_id),
        ]

        mock_lti_registration_get.return_value = self.mock_registration

        call_command('manage_lti_key', *args_get)
        print("get")
        mock_lti_registration_get.assert_called_once_with(
            client_id= self.client_id,
        )
        self.assertEqual(self.mock_registration.uuid, self.uuid)

    @patch('lti_tool.models.LtiRegistration.objects.get')
    @patch('lti_tool.models.LtiDeployment.objects.update_or_create')
    def test_update_lti_key(self, mock_lti_deployment_update_or_create: MagicMock, mock_lti_registration_get: MagicMock) -> None:
        new_client_id: int = 54321   
        new_deployment_id: str = "new-deployment-id"

        args_update: list[str] = [
            '--action', 'update',
            '--id', str(self.id),
            '--client_id', str(new_client_id),
            '--deployment_id', new_deployment_id
        ]

        self.mock_registration.client_id = new_client_id
        self.mock_deployment.deployment_id = new_deployment_id

        mock_lti_registration_get.return_value = self.mock_registration
        mock_lti_deployment_update_or_create.return_value = (self.mock_deployment, True)

        call_command('manage_lti_key', *args_update)

        mock_lti_registration_get.assert_called_once_with(id=self.id)
        self.assertEqual(self.mock_registration.client_id, new_client_id)
        # self.mock_registration.save.assert_called_once()

        mock_lti_deployment_update_or_create.assert_called_once_with(
            registration=self.mock_registration,
            deployment_id=new_deployment_id,
            defaults={'is_active': True}
        )
        self.assertEqual(self.mock_deployment.deployment_id, new_deployment_id)
