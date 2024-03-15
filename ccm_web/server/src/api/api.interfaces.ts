import { hasKeys } from '../typeUtils'

import { CirrusErrorData } from '../invitation/cirrus-invitation.interfaces'

export interface Globals {
  environment: 'production' | 'development'
  canvasURL: string
  user: {
    loginId: string
    hasCanvasToken: boolean
  }
  userLoginId: string
  course: {
    id: number
    roles: string[]
  },
  csrfToken: string
  baseHelpURL: string
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

export function isAPIErrorData (value: unknown): value is APIErrorData {
  return hasKeys(value, ['statusCode', 'errors'])
}

export interface ExternalUserData {
  email: string
  userCreated: boolean | APIErrorPayload
  invited?: true | CirrusErrorData
}

interface ExternalUserCreationResultBase {
  data: ExternalUserData[]
}

interface ExternalUserCreationFailureResult extends ExternalUserCreationResultBase {
  success: false
  statusCode: number
}

interface ExternalUserCreationSuccessResult extends ExternalUserCreationResultBase {
  success: true
}

export type ExternalUserCreationResult = ExternalUserCreationFailureResult | ExternalUserCreationSuccessResult
