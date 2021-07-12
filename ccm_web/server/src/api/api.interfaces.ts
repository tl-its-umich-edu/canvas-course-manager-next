// import { CanvasService } from '../canvas/canvas.service'
import { HTTPError } from 'got'
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

export interface APIErrorData {
  statusCode: number
  message: string
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
export interface CreateSectionResponseData{
  givenSections: number
  createdSections: number
  statusCode: number[]
  error: Record<any, unknown>
}

export function isAPIErrorData (value: unknown): value is APIErrorData {
  return hasKeys(value, ['statusCode', 'message'])
}

export function handleAPIError (error: unknown): APIErrorData {
  if (error instanceof HTTPError) {
    const { statusCode, statusMessage } = error.response
    return { statusCode, message: `Error(s) from Canvas:  ${statusMessage as string}` }
  } else {
    return { statusCode: 500, message: 'A non-HTTP error occurred while communicating with Canvas.' }
  }
}
