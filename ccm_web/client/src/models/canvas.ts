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

const levelOneAddableRoles = [ClientEnrollmentType.Student]
const levelTwoAddableRoles = [...levelOneAddableRoles, ClientEnrollmentType.Observer]
const levelThreeAddableRoles = [
  ...levelTwoAddableRoles, ClientEnrollmentType.TA, ClientEnrollmentType.Designer, ClientEnrollmentType.Teacher
]

type RankedRoleData = Record<RoleEnum, number>

export const rankedRoleData: RankedRoleData = {
  StudentEnrollment: 0,
  Observer: 0,
  Assistant: 1,
  TaEnrollment: 2,
  TeacherEnrollment: 3,
  DesignerEnrollment: 3,
  'Sub-Account Admin': 3,
  'Account Admin': 3,
  'Tool Installer (by ITS Approval only)': 0,
  'Support Consultant': 0,
  Librarian: 0,
  Grader: 0
} as const

const getMostPrivilegedRole = (roles: RoleEnum[]): RoleEnum => {
  if (roles.length === 0) throw new Error('Roles array must contain one or more roles.')
  return roles.sort(
    (a, b) => rankedRoleData[a] > rankedRoleData[b] ? -1 : 1
  )[0]
}

export const getRolesUserCanEnroll = (roles: RoleEnum[]): ClientEnrollmentType[] => {
  const mostPrivRole = getMostPrivilegedRole(roles)
  const rank = rankedRoleData[mostPrivRole]
  switch (rank) {
    case 1:
      return levelOneAddableRoles
    case 2:
      return levelTwoAddableRoles
    case 3:
      return levelThreeAddableRoles
    default:
      return []
  }
}

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
