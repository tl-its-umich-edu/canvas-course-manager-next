import { hasKeys } from '../typeUtils'

export interface Globals {
  environment: 'production' | 'development'
  userLoginId: string
  course: {
    id: number
    roles: string[]
  }
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
export interface CreateSectionTempDataStore {
  allSuccess: CanvasSectionBase[]
  statusCode: number[]
  errors: CreateSectionError[]
}

export function isAPIErrorData (value: unknown): value is APIErrorData {
  return hasKeys(value, ['statusCode', 'errors'])
}
