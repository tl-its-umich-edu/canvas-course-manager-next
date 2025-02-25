import os, logging
from django.conf import settings

logger = logging.getLogger(__name__)

def check_and_enable_debugpy() -> None:
    debugpy_enable: bool = settings.DEBUGPY_ENABLE
    debugpy_address: str = settings.DEBUGPY_REMOTE_ADDRESS
    debugpy_port: int = settings.DEBUGPY_REMOTE_PORT
    debugpy_wait_for_debugger: bool = settings.DEBUGPY_WAIT_FOR_DEBUGGER

    if debugpy_enable:
        import debugpy
        logging.debug('DEBUGPY: Enabled Listening on ({0}:{1})'.format(debugpy_address, debugpy_port))
        debugpy.listen((debugpy_address, int(debugpy_port)))
        if debugpy_wait_for_debugger:
            logger.info("Waiting for debugger to attach")
            debugpy.wait_for_client()
