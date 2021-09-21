import { hasKeys } from '../typeUtils'

// OAuth

export interface OAuthGoodResponseQuery {
  code: string
  state: string
}
export interface OAuthErrorResponseQuery {
  error: string
  error_description: string
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

export interface TokenRefreshResponseBody extends TokenBaseResponseBody {}

// Entities

export interface CanvasCourseBase {
  id: number
  name: string
  enrollment_term_id: number
}

export interface CanvasCourse extends CanvasCourseBase {
  course_code: string
}

export interface CanvasCourseSection {
  id: number
  name: string
  total_students: number
}

export enum UserEnrollmentType {
  DesignerEnrollment = 'DesignerEnrollment',
  ObserverEnrollment = 'ObserverEnrollment',
  StudentEnrollment = 'StudentEnrollment',
  TaEnrollment = 'TaEnrollment',
  TeacherEnrollment = 'TeacherEnrollment'
}

export interface CanvasEnrollment {
  id: number
  course_id: number
  course_section_id: number
  user_id: number
  type: UserEnrollmentType
}

export type CanvasEntity = CanvasEnrollment | CanvasCourseSection | CanvasCourse

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
  return hasKeys(value, ['error']) && hasKeys(value, ['error_description'])
}
