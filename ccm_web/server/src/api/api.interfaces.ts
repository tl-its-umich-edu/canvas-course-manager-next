import { hasKeys } from '../typeUtils'

export interface Globals {
  environment: 'production' | 'development'
  userLoginId: string
  course: {
    id: number
    roles: string[]
  }
}

export interface APIErrorData {
  statusCode: number
  message: string
}
export interface CanvasSectionBase {
  id: number
  name: string
}

export interface CreateSectionError {
  failedInput: string
  message: string
}

export interface CreateSectionsAPIErrorData {
  statusCode: number
  errors: CreateSectionError[]
}

export function isAPIErrorData (value: unknown): value is APIErrorData {
  return hasKeys(value, ['statusCode', 'message'])
}

export function isAPICreateSectionErrorData (value: unknown): value is CreateSectionsAPIErrorData {
  return hasKeys(value, ['statusCode', 'errors'])
}
