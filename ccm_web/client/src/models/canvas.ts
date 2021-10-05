export interface CanvasCourseBase {
  id: number
  name: string
  enrollment_term_id: number
}

export interface CanvasCourseSectionBase {
  id: number
  name: string
  course_id: number
}

export interface CanvasCourseSection extends CanvasCourseSectionBase {
  total_students: number
}

export interface CanvasEnrollment {
  id: number
  course_id: number
  course_section_id: number
  user_id: number
  type: string // use RoleEnum?
}

export interface CanvasRole {
  clientName: string
  canvasName: string
}

export const canvasRoles: CanvasRole[] = [
  { clientName: 'student', canvasName: 'StudentEnrollment' },
  { clientName: 'teacher', canvasName: 'TeacherEnrollment' },
  { clientName: 'ta', canvasName: 'TaEnrollment' },
  { clientName: 'observer', canvasName: 'ObserverEnrollment' },
  { clientName: 'designer', canvasName: 'DesignerEnrollment' }
]

export const getCanvasRole = (clientName: string): string => {
  const role = canvasRoles.find(r => r.clientName === clientName)
  if (role === undefined) throw Error(`${clientName} is not a valid client name for a Canvas role.`)
  return role.canvasName
}
