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
MAX_ALLOWED_ENROLLMENTS = 2000

ROLE_TO_ENROLLMENT_TYPE = {
    role: f"{role.capitalize()}Enrollment"
    for role in ALLOWED_ROLES
    if role not in ("assistant", "librarian")
}
