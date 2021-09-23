/*
Canvas API scopes

Above each scope string is a comment indicating under which scope group or dropdown the scope
can be found in the API Developer Key interface in Canvas.
*/

const canvasScopes = [
  // Courses
  'url:GET|/api/v1/courses/:id',
  'url:PUT|/api/v1/courses/:id',
  'url:GET|/api/v1/courses',
  // Sections
  'url:GET|/api/v1/courses/:course_id/sections',
  'url:POST|/api/v1/courses/:course_id/sections',
  'url:POST|/api/v1/sections/:id/crosslist/:new_course_id',
  'url:DELETE|/api/v1/sections/:id/crosslist',
  // Enrollments
  'url:POST|/api/v1/sections/:section_id/enrollments',
  // Accounts
  'url:GET|/api/v1/accounts',
  'url:GET|/api/v1/accounts/:account_id/courses'
]

export default canvasScopes
