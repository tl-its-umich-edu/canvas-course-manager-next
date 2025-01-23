from uuid import uuid4
from django.core.management import call_command
from unittest import TestCase
from unittest.mock import patch, MagicMock

class ManageLtiKeyCommandTest(TestCase):
    @patch('lti_tool.models.LtiRegistration.objects.create')
    @patch('lti_tool.models.LtiDeployment.objects.create')
    def test_add_lti_key(self, mock_lti_deployment_create, mock_lti_registration_create):
        name = "Test Registration"
        issuer = "https://canvas.test.instructure.com"
        client_id = 12345
        auth_url_root = "https://sso.test.canvaslms.com"
        deployment_id = "test-deployment-id"

        args_create = [
            '--action', 'create',
            '--name', name,
            '--issuer', issuer,
            '--client_id', str(client_id),
            '--auth_url_root', auth_url_root,
            '--deployment_id', deployment_id,
        ]

        mock_registration = MagicMock()
        mock_registration.name = name
        mock_registration.issuer = issuer
        mock_registration.client_id = client_id
        mock_registration.auth_url = f"{auth_url_root}/api/lti/authorize_redirect"
        mock_registration.token_url = f"{auth_url_root}/login/oauth2/token"
        mock_registration.keyset_url = f"{auth_url_root}/api/lti/security/jwks"
        mock_registration.uuid = uuid4()

        mock_deployment = MagicMock()
        mock_deployment.deployment_id = deployment_id
        mock_deployment.registration = mock_registration

        mock_lti_registration_create.return_value = mock_registration
        mock_lti_deployment_create.return_value = mock_deployment

        call_command('manage_lti_key', *args_create)

        mock_lti_registration_create.assert_called_once_with(
            name=name,
            issuer=issuer,
            client_id=client_id,
            auth_url=f"{auth_url_root}/api/lti/authorize_redirect",
            token_url=f"{auth_url_root}/login/oauth2/token",
            keyset_url=f"{auth_url_root}/api/lti/security/jwks",
        )
        print("create")
        mock_lti_deployment_create.assert_called_once_with(
            registration=mock_registration,
            deployment_id=deployment_id,
            is_active=True,
        )

    @patch('lti_tool.models.LtiRegistration.objects.get')
    def test_get_lti_key(self, mock_lti_registration_get):
        name = "Test Registration"
        issuer = "https://canvas.test.instructure.com"
        client_id = 12345
        auth_url_root = "https://sso.test.canvaslms.com"
        deployment_id = "test-deployment-id"

        args_get = [
            '--action', 'get',
            '--name', name,
            '--issuer', issuer,
            '--client_id', str(client_id),
            '--auth_url_root', auth_url_root,
            '--deployment_id', deployment_id,
        ]

        created_uuid = uuid4()

        mock_registration = MagicMock()
        mock_registration.name = name
        mock_registration.issuer = issuer
        mock_registration.client_id = client_id
        mock_registration.auth_url = f"{auth_url_root}/api/lti/authorize_redirect"
        mock_registration.token_url = f"{auth_url_root}/login/oauth2/token"
        mock_registration.keyset_url = f"{auth_url_root}/api/lti/security/jwks"
        mock_registration.uuid = created_uuid

        mock_lti_registration_get.return_value = mock_registration

        call_command('manage_lti_key', *args_get)
        print("get")
        mock_lti_registration_get.assert_called_once_with(
            client_id=client_id,
        )
        self.assertEqual(mock_registration.uuid, created_uuid)
