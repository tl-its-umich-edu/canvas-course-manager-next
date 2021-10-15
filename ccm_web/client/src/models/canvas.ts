export interface CanvasCourseBase {
  id: number
  name: string
  enrollment_term_id: number
}

export interface CourseWithSections extends CanvasCourseBase {
  sections: CanvasCourseSection[]
}

export interface CanvasCourseSectionBase {
  id: number
  name: string
  course_id: number
  nonxlist_course_id: number | null
}

export interface CanvasCourseSection extends CanvasCourseSectionBase {
  total_students: number
}

export interface CanvasCourseSectionWithCourseName extends CanvasCourseSection {
  course_name: string
}

export interface ICanvasCourseSectionSort {
  description: string
  sort: (sections: CanvasCourseSectionWithCourseName[]) => CanvasCourseSectionWithCourseName[]
}

export class CanvasCourseSectionSort_AZ implements ICanvasCourseSectionSort {
  description = 'Sort alphabetically A to Z'
  sort = (sections: CanvasCourseSectionWithCourseName[]): CanvasCourseSectionWithCourseName[] => {
    return sections.sort((a, b) => {
      return (a.name.localeCompare(b.name, 'en', { sensitivity: 'base', numeric: true }))
    })
  }
}

export class CanvasCourseSectionSort_ZA implements ICanvasCourseSectionSort {
  description = 'Sort alphabetically Z to A'
  sort = (sections: CanvasCourseSectionWithCourseName[]): CanvasCourseSectionWithCourseName[] => {
    const sorter = new CanvasCourseSectionSort_AZ()
    return sorter.sort(sections).reverse()
  }
}

export class CanvasCourseSectionSort_UserCount implements ICanvasCourseSectionSort {
  description = 'Sort by number of users, descending'
  sort = (sections: CanvasCourseSectionWithCourseName[]): CanvasCourseSectionWithCourseName[] => {
    return sections.sort((a, b) => {
      return (b.total_students - a.total_students)
    })
  }
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

export const injectCourseName = (sections: CanvasCourseSection[], courseName: string): CanvasCourseSectionWithCourseName[] => {
  return sections.map(section => { return { ...section, course_name: courseName } })
}
