/*
Interfaces for common objects and entities (e.g. Globals, Course, Section, etc.)
*/

/* Left side = canvas display value
   Right side = canvas internal string representation
*/
export enum RoleEnum {
  'Account Admin' = 'Account Admin',
  'Assistant' = 'Assistant',
  'Designer' = 'DesignerEnrollment',
  'Grader' = 'Grader',
  'Librarian' = 'Librarian',
  'TA' = 'TaEnrollment',
  'Teacher' = 'TeacherEnrollment',
  'Tool installer' = 'Tool Installer (by ITS Approval only)',
  'Subaccount admin' = 'Sub-Account Admin',
  'Support Consultant' = 'Support Consultant'
  // These roles are currently not used, but they could be
  // 'Observer' = 'Observer',
  // 'Participant' = 'Participant',
  // 'Student' = 'Student',
}

export interface User {
  loginId: string
  hasCanvasToken: boolean
}

export interface Course {
  id: number
  roles: RoleEnum[]
}

export interface Globals {
  environment: 'production' | 'development'
  canvasURL: string
  user: User
  course: Course
}

export interface APIErrorPayload {
  [k: string]: unknown
  canvasStatusCode: number
  message: string
  failedInput: string | null
}

const isAPIErrorPayload = (v: Record<string, unknown>): v is APIErrorPayload => {
  return 'canvasStatusCode' in v && 'message' in v && 'failedInput' in v
}

export interface APIErrorData {
  [k: string]: unknown
  statusCode: number
  error?: string
  message?: string | string[]
  redirect?: boolean
}

export interface CanvasAPIErrorData extends APIErrorData {
  errors: APIErrorPayload[]
}

export const isCanvasAPIErrorData = (errorData: APIErrorData): errorData is CanvasAPIErrorData => {
  return (
    'errors' in errorData &&
    Array.isArray(errorData.errors) &&
    errorData.errors.every(e => isAPIErrorPayload(e))
  )
}
