/*
Canvas API scopes, separated by privilege level

Above each scope string is a comment indicating under which scope group or dropdown the scope
can be found in the API Developer Key interface in Canvas.
*/

const privilegeLevelOneScopes = [
  // Courses
  'url:GET|/api/v1/courses/:id',
  'url:PUT|/api/v1/courses/:id',
  'url:POST|/api/v1/courses/:course_id/sections'
]

export { privilegeLevelOneScopes }
