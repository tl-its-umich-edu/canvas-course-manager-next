import os, logging

logger = logging.getLogger(__name__)

def config_to_bool(value: str) -> bool: 
    return str(value).lower() in ('true', '1', 'yes', 'on')

def check_and_enable_debugpy() -> None:
    debugpy_enable: bool = config_to_bool(os.getenv('DEBUGPY_ENABLE', 'False'))
    debugpy_address: str = os.getenv('DEBUGPY_REMOTE_ADDRESS', '0.0.0.0')
    debugpy_port: int = int(os.getenv('DEBUGPY_REMOTE_PORT', 5678))

    if debugpy_enable:
        import debugpy
        logging.debug('DEBUGPY: Enabled Listening on ({0}:{1})'.format(debugpy_address, debugpy_port))
        debugpy.listen((debugpy_address, int(debugpy_port)))