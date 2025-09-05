# Constant for insufficient scopes error message, one place to change if canvas changes it
INSUFFICIENT_SCOPES_ON_ACCESS_TOKEN = 'insufficient scopes on access token'
ALLOWED_ROLES = (
    "student",
    "teacher",
    "ta",
    "observer",
    "designer",
    "assistant",
    "librarian",
)

# Maximum number of enrollments allowed in a single section enrollment request
MAX_ALLOWED_ENROLLMENTS = 5000

MAX_SEARCH_COURSES = 400

ROLE_TO_ENROLLMENT_TYPE = {
    role: f"{role.capitalize()}Enrollment"
    for role in ALLOWED_ROLES
    if role not in ("assistant", "librarian")
}

MAX_CONCURRENCY = 10
CANVAS_ROOT_ACCOUNT_ID = 1
