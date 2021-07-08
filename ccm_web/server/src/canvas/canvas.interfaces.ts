import { hasKeys } from '../typeUtils'

export interface OAuthGoodResponseQuery {
  code: string
  state: string
}
export interface OAuthErrorResponseQuery {
  error: string
  error_description: string
}
export interface TokenResponseBody {
  access_token: string
  token_type: 'Bearer'
  user: {
    id: number
    name: string
    global_id: string
    effective_locale: string
  }
  refresh_token: string
  expires_in: number
}

export interface CanvasCourseBase {
  id: number
  name: string
}

export interface CanvasCourse extends CanvasCourseBase {
  course_code: string
  sections: object[]
}

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
