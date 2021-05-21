import { Globals, HelloMessageData } from './models/models'
import handleErrors from './utils/handleErrors'

export interface LtiProps {
  ltiKey: string | undefined
}

const createAuthHeaders = (key: string | undefined): RequestInit => {
  if (key !== undefined) {
    return {
      credentials: 'include',
      headers: { Authorization: 'Bearer ' + key }
    }
  }
  return {}
}

export const getHelloMessageData = async (key: string | undefined): Promise<HelloMessageData> => {
  const params: RequestInit = {
    method: 'GET',
    ...createAuthHeaders(key)
  }
  const resp = await fetch('/api/hello', params)
  await handleErrors(resp)
  return await resp.json()
}

export const getGlobals = async (key: string | undefined): Promise<Globals> => {
  const params: RequestInit = {
    method: 'GET',
    ...createAuthHeaders(key)
  }
  const resp = await fetch('/api/globals', params)
  await handleErrors(resp)
  return await resp.json()
}

// This is a placeholder for a real implementation (I mean, obviously :D)
export const getCourseSections = async (key: string | undefined, courseId: string): Promise<string[]> => {
  return (['AAAA', 'BBBB'])
}
