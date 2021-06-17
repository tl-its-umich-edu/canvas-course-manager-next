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

export function isAPIErrorData (v: unknown): v is APIErrorData {
  if (typeof v !== 'object' || v === null) return false
  return 'statusCode' in v && 'message' in v
}
