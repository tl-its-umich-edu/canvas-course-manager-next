import { hasKeys } from '../typeUtils'

export interface Globals {
  environment: 'production' | 'development'
  userLoginId: string
  course: {
    id: number
    roles: string[]
  }
}

export interface APIErrorHandler {
  statusCode: number
  message: string
}

export interface APIErrorPayload {
  failedInput: string
  message: string
}
export interface APIErrorData {
  statusCode: number
  errors: APIErrorPayload[]
}
export function isAPIErrorData (value: unknown): value is APIErrorData {
  return hasKeys(value, ['statusCode', 'errors'])
}
