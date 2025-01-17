from django.core.management.base import BaseCommand
from lti_tool.models import LtiRegistration

class Command(BaseCommand):
    help = 'Add a new LTI Registration'

    def add_arguments(self, parser):
        parser.add_argument('--name', type=str, help='Name of the LTI Registration')
        parser.add_argument('--issuer', type=str, help='Canvas issuer for LTI Launch, with or without https://'
                            , default="canvas.instructure.com")
        parser.add_argument('--client_id', type=int, required=True, help="Canvas LTI Client ID")
        parser.add_argument('--auth_url_root', type=str, help='Auth URLS, with or without https://'
                            , default="sso.canvaslms.com")

    def handle(self, *args, **options: dict):
        
        issuer = options["issuer"]
        # If platform doesn't contain https add it
        if not issuer.startswith("https://"):
            issuer = f"https://{issuer}"
        auth_url_root = options["auth_url_root"]
        # If platform doesn't contain https add it
        if not auth_url_root.startswith("https://"):
            auth_url_root = f"https://{auth_url_root}"
        
        name = options['name']
        client_id = options['client_id']

        auth_url = f"{auth_url_root}/api/lti/authorize_redirect"
        token_url = f"{auth_url_root}/login/oauth2/token"
        keyset_url = f"{auth_url_root}/api/lti/security/jwks"

        registration = LtiRegistration.objects.create(
            name=name,
            issuer=issuer,
            client_id=client_id,
            auth_url=auth_url,
            token_url=token_url,
            keyset_url=keyset_url,
        )

        self.stdout.write(self.style.SUCCESS(f'Successfully added LTI Registration: {registration.name} (UUID: {registration.uuid})'))
