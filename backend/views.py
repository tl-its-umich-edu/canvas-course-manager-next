from django.shortcuts import redirect, render
from lti_tool.views import LtiLaunchBaseView

# Create your views here.
from django.shortcuts import render

def home_view(request):
    return render(request, 'home.html')

class ApplicationLaunchView(LtiLaunchBaseView):
    
    def handle_resource_launch(self, request, lti_launch):
        ...  # Required. Typically redirects the users to the appropriate page.
        launch_data = lti_launch.get_launch_data()
        # if not validate_custom_lti_launch_data(launch_data):
            # return redirect("error")
        # if not login_user_from_lti(request, launch_data):
            # return redirect("error")
        return redirect("home")

    def handle_deep_linking_launch(self, request, lti_launch):
        ...  # Optional.

    def handle_submission_review_launch(self, request, lti_launch):
        ...  # Optional.

    def handle_data_privacy_launch(self, request, lti_launch):
        ...  # Optional.