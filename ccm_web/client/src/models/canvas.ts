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

export enum CanvasRoleType {
  Student = 'StudentEnrollment',
  Teacher = 'TeacherEnrollment',
  TA = 'TaEnrollment',
  Observer = 'ObserverEnrollment',
  Designer = 'DesignerEnrollment'
}

export enum ClientRoleType {
  Student = 'student',
  Teacher = 'teacher',
  TA = 'ta',
  Observer = 'observer',
  Designer = 'designer'
}
const clientStringValues = Object.values(ClientRoleType).map(m => String(m))

export interface CanvasEnrollment {
  id: number
  course_id: number
  course_section_id: number
  user_id: number
  type: CanvasRoleType
}

const clientToCanvasRoleMap: Record<ClientRoleType, CanvasRoleType> = {
  student: CanvasRoleType.Student,
  teacher: CanvasRoleType.Teacher,
  ta: CanvasRoleType.TA,
  observer: CanvasRoleType.Observer,
  designer: CanvasRoleType.Designer
}

export const isValidRole = (role: string): role is ClientRoleType => {
  return clientStringValues.includes(role)
}

export const getCanvasRole = (clientName: ClientRoleType): CanvasRoleType => {
  return clientToCanvasRoleMap[clientName]
}
