import { hasKeys } from '../typeUtils'

export interface HelloData {
  message: string
}

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
export interface CreateSectionsResponseObject extends APIErrorData {
  sectionName: string
}

export interface CanvasSectionBase {
  name: string
}

export interface CreateSectionReturnResponse {
  statusCode: number
  message: Record<any, unknown>
}

export interface CreateSectionResponseData {
  givenSections: number
  createdSections: number
  statusCode: number[]
  error: Record<any, unknown>
}

export function isAPIErrorData (value: unknown): value is APIErrorData {
  return hasKeys(value, ['statusCode', 'errors'])
}
