import getLTIKey from './utils/getLTIKey'

import { HelloMessageData } from './models'

const getDefaultHeaders = (): HeadersInit | undefined => {
  const ltiKey = getLTIKey()
  if (ltiKey !== undefined) {
    return { Authorization: 'Bearer ' + ltiKey }
  }
  return undefined
}

export const getHelloMessageData = async (): Promise<HelloMessageData> => {
  const params: RequestInit = {
    method: 'GET',
    credentials: 'include',
    headers: getDefaultHeaders()
  }
  const resp = await fetch('/api/hello', params)
  return await resp.json() as HelloMessageData
}
