from django.core.management.base import BaseCommand
from lti_tool.models import LtiRegistration, LtiDeployment
import random
import string
from typing import Any, Dict

class Command(BaseCommand):
    help = 'Add, get, or update an LTI Registration and Deployment ID for a Canvas LTI tool \
            please provide the following arguments: --action, --name, --issuer, --client_id, --auth_url_root, --deployment_id'

    def add_arguments(self, parser) -> None:
        parser.add_argument('--action', type=str, required=True, choices=['create', 'get','update'], help='Action to perform: create, get, or update')
        parser.add_argument('--name', type=str, help='Name of the LTI Registration', default=''.join(random.choices(string.ascii_letters + string.digits, k=10)))
        parser.add_argument('--issuer', type=str, help='Canvas instance domain like canvas.test.instructure.com for LTI Launch, with or without https://'
                            , default="canvas.test.instructure.com")
        parser.add_argument('--client_id', type=int, help="Canvas LTI Client ID", default=lambda: random.randint(10**16, 10**17-1))
        parser.add_argument('--auth_url_root', type=str, help='Auth URLS domain like sso.test.canvaslms.com, with or without https://'
                            , default="sso.test.canvaslms.com")
        parser.add_argument('--deployment_id', type=str, help="Deployment ID for the LTI Deployment")
        parser.add_argument('--id', type=int, help="ID of the LTI Registration to update")

    def handle(self, *args: Any, **options: Dict[str, Any]) -> None:
        action: str = options['action']
        client_id: int = options['client_id']

        if action == 'create':
            issuer: str = options["issuer"]
            # If platform doesn't contain https add it
            if not issuer.startswith("https://"):
                issuer = f"https://{issuer}"
            auth_url_root: str = options["auth_url_root"]
            # If platform doesn't contain https add it
            if not auth_url_root.startswith("https://"):
                auth_url_root = f"https://{auth_url_root}"
            
            name: str = options['name']
            deployment_id: str = options['deployment_id']

            auth_url: str = f"{auth_url_root}/api/lti/authorize_redirect"
            token_url: str = f"{auth_url_root}/login/oauth2/token"
            keyset_url: str = f"{auth_url_root}/api/lti/security/jwks"

            try:
                registration: LtiRegistration = LtiRegistration.objects.create(
                    name=name,
                    issuer=issuer,
                    client_id=client_id,
                    auth_url=auth_url,
                    token_url=token_url,
                    keyset_url=keyset_url,
                )

                deployment: LtiDeployment = LtiDeployment.objects.create(
                    registration=registration,
                    deployment_id=deployment_id,
                    is_active=True,
                )
            except Exception as e:
                self.stderr.write(self.style.ERROR(f'Error adding LTI Registration: {e}'))
                return

            self.stdout.write(self.style.SUCCESS(f'Successfully added LTI Registration name: {registration.name} (UUID: {registration.uuid}) with deployment_id: {deployment.deployment_id}'))
        
        elif action == 'get':
            try:
                registration: LtiRegistration = LtiRegistration.objects.get(client_id=client_id)
                self.stdout.write(self.style.SUCCESS(f'LTI Registration UUID: {registration.uuid} Name: {registration.name}'))
            except LtiRegistration.DoesNotExist:
                self.stderr.write(self.style.ERROR('LTI Registration not found'))

        elif action == 'update':
            try:
                registration_id: int = options['id']
                registration: LtiRegistration = LtiRegistration.objects.get(id=registration_id)
                client_id: int = options['client_id']
                deployment_id: str = options['deployment_id']
                registration.client_id = client_id
                registration.save()

                deployment, created = LtiDeployment.objects.update_or_create(
                    registration=registration,
                    deployment_id=deployment_id,
                    defaults={'is_active': True}
                )

                self.stdout.write(self.style.SUCCESS(f'Successfully updated LTI Registration ID: {registration_id} with new client_id: {client_id} and deployment_id: {deployment.deployment_id}'))
            except LtiRegistration.DoesNotExist:
                self.stderr.write(self.style.ERROR('LTI Registration not found'))
