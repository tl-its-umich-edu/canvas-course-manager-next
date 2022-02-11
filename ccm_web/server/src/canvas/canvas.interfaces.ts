import { hasKeys } from '../typeUtils'

// OAuth

export interface OAuthGoodResponseQuery {
  code: string
  state: string
}
export interface OAuthErrorResponseQuery {
  error: string
  error_description?: string
  state?: string
}

interface TokenBaseResponseBody {
  access_token: string
  token_type: 'Bearer'
  user: {
    id: number
    name: string
    global_id: string
    effective_locale: string
  }
  expires_in: number
}

export interface TokenCodeResponseBody extends TokenBaseResponseBody {
  refresh_token: string
}

export interface TokenRefreshResponseBody extends TokenBaseResponseBody { }

// Entities

export enum CourseWorkflowState {
  Created = 'created',
  Claimed = 'claimed',
  Available = 'available',
  Completed = 'completed',
  Deleted = 'deleted'
}

export interface CanvasCourseBase {
  id: number
  name: string
  enrollment_term_id: number
}

export interface CanvasCourse extends CanvasCourseBase {
  course_code: string
}

export interface CanvasCourseInput {
  name?: string
  course_code?: string
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

export enum CanvasRole {
  AccountAdmin = 'Account Admin',
  SubAccountAdmin = 'Sub-Account Admin',
  SupportConsultant = 'Support Consultant',
  Assistant = 'Assistant',
  DesignerEnrollment = 'DesignerEnrollment',
  ObserverEnrollment = 'ObserverEnrollment',
  StudentEnrollment = 'StudentEnrollment',
  TaEnrollment = 'TaEnrollment',
  TeacherEnrollment = 'TeacherEnrollment',
  Librarian = 'Librarian'
}

export enum CustomCanvasRoleType {
  Librarian = CanvasRole.Librarian,
  Assistant = CanvasRole.Assistant
}

export enum UserEnrollmentType {
  DesignerEnrollment = CanvasRole.DesignerEnrollment,
  ObserverEnrollment = CanvasRole.ObserverEnrollment,
  StudentEnrollment = CanvasRole.StudentEnrollment,
  TaEnrollment = CanvasRole.TaEnrollment,
  TeacherEnrollment = CanvasRole.TeacherEnrollment,
  Librarian = CanvasRole.Librarian,
  Assistant = CanvasRole.Assistant
}

// valid role types for LTI launch
// as defined in https://docs.google.com/spreadsheets/d/1pm5y9FX0zrDX7Zy3mOyDLxmA-iKoWfmlxvbtNkWg6Zw/edit#gid=1360549473
export enum LTIEnrollmentType {
  AccountAdmin = CanvasRole.AccountAdmin,
  SubAccountAdmin = CanvasRole.SubAccountAdmin,
  SupportConsultant = CanvasRole.SupportConsultant,
  TeacherEnrollment = CanvasRole.TeacherEnrollment,
  DesignerEnrollment = CanvasRole.DesignerEnrollment,
  TaEnrollment = CanvasRole.TaEnrollment,
  Assistant = CanvasRole.Assistant
}

export interface CanvasEnrollment {
  id: number
  course_id: number
  course_section_id: number
  user_id: number
  type: UserEnrollmentType
}

export interface CanvasEnrollmentWithUser extends CanvasEnrollment {
  user: { login_id: string }
}

export interface CanvasAccount {
  id: number
  name: string
  parent_account_id: number | null
}

// Composites

export interface CourseWithSections extends CanvasCourseBase {
  sections: CanvasCourseSection[]
}

// Errors

interface CanvasError {
  message: string
}

function isCanvasError (value: unknown): value is CanvasError {
  return hasKeys(value, ['message'])
}

export interface CanvasErrorBody {
  errors: CanvasError[]
}

export function isCanvasErrorBody (value: unknown): value is CanvasErrorBody {
  if (!hasKeys(value, ['errors']) || !Array.isArray(value.errors)) {
    return false
  } else {
    const result = value.errors.map(e => isCanvasError(e)).every(e => e)
    return result
  }
}

export const isOAuthErrorResponseQuery = (value: unknown): value is OAuthErrorResponseQuery => {
  return hasKeys(value, ['error'])
}
