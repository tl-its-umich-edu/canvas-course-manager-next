import { APIErrorData, CanvasAPIErrorPayload, isCanvasAPIErrorPayload } from './models'
import { hasKeys } from './typeUtils'

interface CirrusErrorData {
  statusCode: number
  messages: string[]
}

export interface ExternalUserResultBase {
  email: string
}

const isExternalUserResultBase = (v: unknown): v is ExternalUserResultBase => {
  return hasKeys(v, ['email']) && typeof v.email === 'string'
}

interface ExternalUserSuccessNotCreated extends ExternalUserResultBase {
  userCreated: false
}

interface ExternalUserSuccessCreatedAndInvited extends ExternalUserResultBase {
  userCreated: true
  invited: true
}

export type ExternalUserSuccess = ExternalUserSuccessNotCreated | ExternalUserSuccessCreatedAndInvited

export const isExternalUserSuccess = (v: unknown): v is ExternalUserSuccess => {
  return (
    isExternalUserResultBase(v) &&
    hasKeys(v, ['userCreated']) &&
    (
      (v.userCreated === true && hasKeys(v, ['invited']) && v.invited === true) ||
      (v.userCreated === false)
    )
  )
}

interface ExternalUserCreationFailure extends ExternalUserResultBase {
  userCreated: CanvasAPIErrorPayload
}

interface ExternalUserInvitationFailure extends ExternalUserResultBase {
  userCreated: true
  invited: CirrusErrorData
}

export type ExternalUserFailure = ExternalUserCreationFailure | ExternalUserInvitationFailure

export const isExternalUserFailure = (v: unknown): v is ExternalUserFailure => {
  return (
    isExternalUserResultBase(v) &&
    (
      (hasKeys(v, ['userCreated']) && isCanvasAPIErrorPayload(v.userCreated)) ||
      (
        hasKeys(v, ['userCreated', 'invited']) &&
        v.userCreated === true &&
        hasKeys(v.invited, ['statusCode', 'messages']) &&
        typeof v.invited.statusCode === 'number' &&
        Array.isArray(v.invited.messages) &&
        v.invited.messages.every(m => typeof m === 'string')
      )
    )
  )
}

export type ExternalUserResult = ExternalUserFailure | ExternalUserSuccess

export interface ExternalUserAPIErrorData extends APIErrorData {
  data: ExternalUserResult[]
}

export const isExternalUserAPIErrorData = (errorData: APIErrorData): errorData is ExternalUserAPIErrorData => {
  if (!(hasKeys(errorData, ['data']) && Array.isArray(errorData.data))) return false
  return errorData.data.every(r => isExternalUserFailure(r) || isExternalUserSuccess(r))
}
