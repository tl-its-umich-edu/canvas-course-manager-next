# backend/test_setup.py
from django.test.runner import DiscoverRunner
from backend.debugpy import check_and_enable_debugpy

class CustomTestRunner(DiscoverRunner):
    def setup_test_environment(self, **kwargs):
        super().setup_test_environment(**kwargs)
        # Call the check_and_enable_debugpy function
        check_and_enable_debugpy()