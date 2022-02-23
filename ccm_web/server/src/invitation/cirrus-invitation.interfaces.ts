import { hasKeys } from '../typeUtils'

export const cirrusAPIVersion = '/api/v1'
export const CirrusAPIEndPoint = '/batchInviteCsv'

export interface CirrusInvitationResponse {
  clientRequestID?: string
  spEntityId?: string
  batchId?: string
  errors: string[]
  addresses?: string[]
}

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
