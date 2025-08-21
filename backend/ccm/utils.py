from functools import wraps
import os
import time
from typing import List, Optional
from csp.constants import SELF

def parse_csp(csp_key: str, extra_csp_sources: Optional[List[str]] = None) -> List[str]:
    """
    Parse CSP source from an environment variable.
    - If the variable is set, split its value by commas.
    """
    csp_value = os.getenv(csp_key, '').split(',')
    DEFAULT_CSP_VALUE = [SELF]
    
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

def timeit(func):
    """
    Decorator to measure the execution time of a function.
    """
    @wraps(func)
    def timeit_wrapper(*args, **kwargs):
        start_time = time.perf_counter()
        result = func(*args, **kwargs)
        end_time = time.perf_counter()
        total_time = end_time - start_time
        print(f"Function '{func.__name__}{args} {kwargs}' took {total_time:.4f} seconds to execute.")
        return result
    return timeit_wrapper

