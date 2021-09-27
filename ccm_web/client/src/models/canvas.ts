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
