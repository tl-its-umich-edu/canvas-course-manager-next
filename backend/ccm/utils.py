import os
from typing import List, Optional

def parse_csp(csp_key: str, extra_csp_sources: Optional[List[str]] = None) -> List[str]:
    """
    Parse CSP source from an environment variable.
    - If the variable is set, split its value by commas.
    """
    csp_value = os.getenv(csp_key, '').split(',')
    DEFAULT_CSP_VALUE = ["'self'"]
    
    if not any(csp_value):
        if extra_csp_sources is not None:
            return DEFAULT_CSP_VALUE + extra_csp_sources
        else:
            return DEFAULT_CSP_VALUE
    else:
        if extra_csp_sources is not None:
            return DEFAULT_CSP_VALUE + csp_value + extra_csp_sources
        else:
            return DEFAULT_CSP_VALUE + csp_value 

