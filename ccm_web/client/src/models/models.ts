/*
Interfaces for common objects and entities (e.g. Globals, Course, Section, etc.)
*/

import { hasKeys } from './typeUtils'

// Globals

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
  'Support Consultant' = 'Support Consultant',
  // These roles are currently not used, but they could be
  'Observer' = 'Observer',
  // 'Participant' = 'Participant',
  'Student' = 'StudentEnrollment'
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
  csrfToken: string
  baseHelpURL: string
}

export interface CsrfToken {
  token: string
}

// API Errors

export interface CanvasAPIErrorPayload {
  canvasStatusCode: number
  message: string
  failedInput: string | null
}

export const isCanvasAPIErrorPayload = (v: unknown): v is CanvasAPIErrorPayload => {
  return (
    hasKeys(v, ['canvasStatusCode', 'message', 'failedInput']) &&
    typeof v.canvasStatusCode === 'number' &&
    typeof v.message === 'string' &&
    (v.failedInput === null || typeof v.failedInput === 'string')
  )
}

export interface APIErrorData extends Record<string, unknown> {
  statusCode: number
  error?: string
  message?: string | string[]
  redirect?: boolean
}

export interface CanvasAPIErrorData extends APIErrorData {
  errors: CanvasAPIErrorPayload[]
}

export const isCanvasAPIErrorData = (errorData: APIErrorData): errorData is CanvasAPIErrorData => {
  return (
    'errors' in errorData &&
    Array.isArray(errorData.errors) &&
    errorData.errors.every(e => isCanvasAPIErrorPayload(e))
  )
}

export interface APIErrorWithContext {
  error: Error
  context: string
}

// Validation

export enum InvalidationType {
  Error,
  Warning
}

// Files

export interface DownloadData {
  data: string
  fileName: string
}

// CSV Workflow

export enum CSVWorkflowStep {
  Select = 0, // Select Section
  Upload = 1, // Upload CSV
  Review = 2, // Review Data
  Confirmation = 3 // Success Confirmation
}
