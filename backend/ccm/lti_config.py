import random, logging, string
from django.contrib.auth import login as ccm_user_login
from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import redirect
from django.urls import reverse
from lti_tool.views import LtiLaunchBaseView
from pylti1p3.exception import LtiException
from django.contrib.auth.models import User
from django.shortcuts import redirect


logger = logging.getLogger(__name__)

class LTILaunchError(Exception):
    """
    Exception class for errors that occur while processing data from the LTI launch
    """


class CCMLTILaunchView(LtiLaunchBaseView):
    
    def validate_custom_lti_launch_data(self, lti_launch):
      expected_keys = ['roles', 'is_root_account_admin', 'login_id', 'course_id' ]
      main_key = "https://purl.imsglobal.org/spec/lti/claim/custom"
      if main_key not in lti_launch:
          raise LTILaunchError(
            'You need to have custom parameters configured on your LTI Launch. ' +
            'Please see the LTI installation guide in README for more information.'
        )
      
      custom_data = lti_launch[main_key]
      missing_keys = [key for key in expected_keys if key not in custom_data]
      if missing_keys:
          raise LTILaunchError(f"LTI custom variables `{', '.join(missing_keys)}` are missing in the `{main_key}` ")
    
    def login_user_from_lti(self, request, launch_data):
      try:
          first_name = launch_data.get('given_name')
          last_name = launch_data.get('family_name')
          email = launch_data.get('email')
          username = launch_data['https://purl.imsglobal.org/spec/lti/claim/custom']['login_id']
          logger.info(f'User {first_name} {last_name} {email} {username} launched the tool')
          user_obj = User.objects.get(username=username)
      except User.DoesNotExist:
          logger.warning(f'user {username} never logged into the app, hence creating the user')
          password = ''.join(random.sample(string.ascii_letters, settings.RANDOM_PASSWORD_DEFAULT_LENGTH))
          user_obj = User.objects.create_user(username=username, email=email, password=password, first_name=first_name,
                                              last_name=last_name)
      except Exception as e:
          raise LTILaunchError(f'Error occured while getting the user info from LTI launch data due to {e}')
          
          
      try: 
          ccm_user_login(request, user_obj)
      except (ValueError, TypeError, Exception) as e:
          raise LTILaunchError(f'Logging user after LTI launch failed due to {e}')
    
    def handle_resource_launch(self, request, lti_launch):
        try:
            launch_data = lti_launch.get_launch_data()
            self.validate_custom_lti_launch_data(launch_data)
            self.login_user_from_lti(request, launch_data)
        except (LtiException, LTILaunchError, Exception) as e:
            logger.error(e)
            response = HttpResponse(e)
            response.status_code = 401
            return response 
        return redirect(reverse('home'))
