import { RoleEnum } from './models'

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

export enum CanvasEnrollmentType {
  Student = 'StudentEnrollment',
  Teacher = 'TeacherEnrollment',
  TA = 'TaEnrollment',
  Observer = 'ObserverEnrollment',
  Designer = 'DesignerEnrollment'
}

export enum ClientEnrollmentType {
  Student = 'student',
  Teacher = 'teacher',
  TA = 'ta',
  Observer = 'observer',
  Designer = 'designer'
}
const clientStringValues = Object.values(ClientEnrollmentType).map(m => String(m))

export interface CanvasEnrollment {
  id: number
  course_id: number
  course_section_id: number
  user_id: number
  type: CanvasEnrollmentType
}

const clientToCanvasRoleMap: Record<ClientEnrollmentType, CanvasEnrollmentType> = {
  student: CanvasEnrollmentType.Student,
  teacher: CanvasEnrollmentType.Teacher,
  ta: CanvasEnrollmentType.TA,
  observer: CanvasEnrollmentType.Observer,
  designer: CanvasEnrollmentType.Designer
}

interface AddableRoleData {
  addable: true
  rank: number
  canvasName: CanvasEnrollmentType
  clientName: ClientEnrollmentType
}

interface NotAddableRoleData {
  rank: number
  addable: false
}

type RoleData = AddableRoleData | NotAddableRoleData

type CanvasRoleData = Record<RoleEnum, RoleData>

export const AllCanvasRoleData: CanvasRoleData = {
  StudentEnrollment: {
    rank: 0,
    addable: true,
    canvasName: CanvasEnrollmentType.Student,
    clientName: ClientEnrollmentType.Student
  },
  Observer: {
    rank: 1,
    addable: true,
    canvasName: CanvasEnrollmentType.Observer,
    clientName: ClientEnrollmentType.Observer
  },
  TaEnrollment: {
    rank: 2,
    addable: true,
    canvasName: CanvasEnrollmentType.Observer,
    clientName: ClientEnrollmentType.TA
  },
  DesignerEnrollment: {
    rank: 3,
    addable: true,
    canvasName: CanvasEnrollmentType.Designer,
    clientName: ClientEnrollmentType.Designer
  },
  TeacherEnrollment: {
    rank: 4,
    addable: true,
    canvasName: CanvasEnrollmentType.Teacher,
    clientName: ClientEnrollmentType.Teacher
  },
  'Sub-Account Admin': {
    rank: 5,
    addable: false
  },
  'Account Admin': {
    rank: 6,
    addable: false
  },
  'Tool Installer (by ITS Approval only)': {
    rank: -1,
    addable: false
  },
  'Support Consultant': {
    rank: -1,
    addable: false
  },
  Librarian: {
    rank: -1,
    addable: false
  },
  Assistant: {
    rank: -1,
    addable: false
  },
  Grader: {
    rank: -1,
    addable: false
  }
} as const

export const isValidRole = (role: string): role is ClientEnrollmentType => {
  return clientStringValues.includes(role)
}

export const getCanvasRole = (clientName: ClientEnrollmentType): CanvasEnrollmentType => {
  return clientToCanvasRoleMap[clientName]
}

export const injectCourseName = (sections: CanvasCourseSection[], courseName: string): CanvasCourseSectionWithCourseName[] => {
  return sections.map(section => { return { ...section, course_name: courseName } })
}

export function sortSections<T extends CanvasCourseSection> (sections: T[]): T[] {
  return sections.sort((a, b) => { return a.name.localeCompare(b.name, undefined, { numeric: true }) })
}
