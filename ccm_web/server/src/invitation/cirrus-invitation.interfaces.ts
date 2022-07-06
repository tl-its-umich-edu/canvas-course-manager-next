import { hasKeys } from '../typeUtils'

export const cirrusAPIVersion = '/api/v1'
export const cirrusAPIEndPoint = '/batchInviteCsv'

export interface CirrusInvitationResponse {
  clientRequestID?: string
  spEntityId?: string
  batchId?: string
  errors: string[]
  addresses?: string[]
}

// Error data expected to be returned from the Cirrus API
export interface CirrusAPIErrorData {
  errors: string[]
}

export const isCirrusAPIErrorData = (value: unknown): value is CirrusAPIErrorData => {
  return (
    hasKeys(value, ['errors']) &&
    Array.isArray(value.errors) &&
    value.errors.every(e => typeof e === 'string')
  )
}

// Normalized error data returned from the invitation service
export interface CirrusErrorData {
  statusCode: number
  messages: string[]
}

export const isCirrusErrorData = (value: unknown): value is CirrusErrorData => {
  return (
    hasKeys(value, ['statusCode', 'messages']) &&
    Array.isArray(value.messages) &&
    value.messages.every(m => typeof m === 'string')
  )
}
