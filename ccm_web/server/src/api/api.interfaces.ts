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
export interface createSectionError {
  sectionName: string
  message: string
}

export interface CreateSectionsAPIErrorData {
  statusCode: number
  errors: createSectionError[]
}
export interface CreateSectionTempDataStore {
  allSuccess: CanvasSectionBase[]
  statusCode: number[]
  errors: createSectionError[]
}

export function isAPIErrorData (value: unknown): value is APIErrorData {
  return hasKeys(value, ['statusCode', 'errors'])
}
