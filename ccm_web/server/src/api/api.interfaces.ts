import { hasKey } from '../typeUtils'

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

export function isAPIErrorData (value: unknown): value is APIErrorData {
  return hasKey(value, 'statusCode') && hasKey(value, 'message')
}
