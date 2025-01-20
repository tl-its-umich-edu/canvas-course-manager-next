import os
import debugpy
import logging

def config_to_bool(value: str) -> bool: 
    return str(value).lower() in ('true', '1', 'yes', 'on')

def check_and_enable_debugpy() -> None:
    debugpy_enable: bool = config_to_bool(os.getenv('DEBUGPY_ENABLE', 'False'))
    debugpy_address: str = '0.0.0.0'
    debugpy_port: int = 4030

    if debugpy_enable:
        logging.debug('DEBUGPY: Enabled Listening on ({0}:{1})'.format(debugpy_address, debugpy_port))
        debugpy.listen((debugpy_address, debugpy_port))