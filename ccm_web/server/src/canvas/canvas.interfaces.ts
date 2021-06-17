import { hasKey } from '../typeUtils'

export interface OAuthResponseQuery {
  code: string
  state: string
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
}

interface CanvasError {
  message: string
}

function isCanvasError (v: unknown): v is CanvasError {
  return hasKey(v, 'message')
}

export interface CanvasErrorBody {
  errors: CanvasError[]
}

export function isCanvasErrorBody (v: unknown): v is CanvasErrorBody {
  if (!hasKey(v, 'errors') || !Array.isArray(v.errors)) {
    return false
  } else {
    const result = v.errors.map(e => isCanvasError(e)).every(e => e)
    return result
  }
}
