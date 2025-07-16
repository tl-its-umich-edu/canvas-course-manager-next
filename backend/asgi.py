"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application

from backend.debugpy import check_and_enable_debugpy

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

check_and_enable_debugpy()

application = get_asgi_application()
