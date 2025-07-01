ALLOWED_ROLES = (
    "student",
    "teacher",
    "ta",
    "observer",
    "designer",
    "assistant",
    "librarian",
)

ROLE_TO_ENROLLMENT_TYPE = {
    role: f"{role.capitalize()}Enrollment"
    for role in ALLOWED_ROLES
    if role not in ("assistant", "librarian")
}
