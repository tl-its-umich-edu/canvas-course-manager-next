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
  // These roles are currently not used, but they could be
  // 'Observer' = 'Observer',
  // 'Participant' = 'Participant',
  // 'Student' = 'Student',
}

export interface Course {
  id: number
  roles: RoleEnum[]
}

export interface Globals {
  environment: 'production' | 'development'
  userLoginId: string
  course: Course
}

export interface APIErrorPayload {
  canvasStatusCode: number
  message: string
  failedInput: string | null
}

export interface APIErrorData {
  statusCode: number
  errors: APIErrorPayload[]
}

export interface IDefaultError {
  errors: APIErrorPayload[]
}
