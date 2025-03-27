DEFAUlT_CANVAS_SCOPES = [
    # Courses
    'url:GET|/api/v1/courses/:id',
    'url:PUT|/api/v1/courses/:id',
    # Sections
    'url:GET|/api/v1/courses/:course_id/sections',
    'url:POST|/api/v1/courses/:course_id/sections'
]
