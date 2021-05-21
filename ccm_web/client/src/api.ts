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

const delay = async (ms: number): Promise<void> => {
  await new Promise<void>(resolve => setTimeout(() => resolve(), ms))
}

// This is a placeholder for a real implementation (I mean, obviously :D)
export const getCourseSections = async (key: string | undefined, courseId: string): Promise<string[]> => {
  const sections = await delay(2000).then(() => {
    if (Math.random() * 2 > 1) {
      return (['AAAA', 'BBBB'])
    } else {
      return new Promise<string[]>((resolve, reject) => { reject(new Error('Error retrieving course section information.')) })
    }
  })
  return sections
}
