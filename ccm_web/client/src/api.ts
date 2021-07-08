import { CanvasCourseBase } from './models/canvas'
import { Globals } from './models/models'
import handleErrors from './utils/handleErrors'

export interface LtiProps {
  ltiKey: string | undefined
}

const initRequest = (key: string | undefined, headers: string[][] = []): RequestInit => {
  if (key !== undefined) {
    headers.push(['Authorization', 'Bearer ' + key])
    return {
      credentials: 'include',
      headers: headers
    }
  }
  return {}
}

const getGet = (key: string | undefined): RequestInit => {
  const request = initRequest(key)
  request.method = 'GET'
  return request
}

// This currently assumes all put requests have a JSON payload and receive a JSON response.
const getPut = (key: string | undefined, body: string): RequestInit => {
  const headers: string[][] = []
  headers.push(['Content-Type', 'application/json'])
  headers.push(['Accept', 'application/json'])
  const request = initRequest(key, headers)
  request.method = 'PUT'
  request.body = body
  return request
}

export const getCourse = async (key: string | undefined, courseId: number): Promise<CanvasCourseBase> => {
  const request = getGet(key)
  const resp = await fetch(`/api/course/${courseId}/name`, request)
  await handleErrors(resp)
  return await resp.json()
}

export const setCourseName = async (key: string | undefined, courseId: number, newName: string): Promise<CanvasCourseBase> => {
  const request = getPut(key, JSON.stringify({ newName: newName }))
  const resp = await fetch(`/api/course/${courseId}/name`, request)
  await handleErrors(resp)
  return await resp.json()
}

export const getGlobals = async (key: string | undefined): Promise<Globals> => {
  const request = getGet(key)
  const resp = await fetch('/api/globals', request)
  await handleErrors(resp)
  return await resp.json()
}

const delay = async (ms: number): Promise<void> => {
  await new Promise<void>(resolve => setTimeout(() => resolve(), ms))
}

// This is a placeholder for a real implementation (I mean, obviously :D)
export const getCourseSections = async (key: string | undefined, courseId: string): Promise<string[]> => {
  const sections = await delay(2000).then(() => {
    if (Math.random() * 3 > 1) {
      return (['AAAA', 'BBBB'])
    } else {
      return new Promise<string[]>((resolve, reject) => { reject(new Error('Error retrieving course section information.')) })
    }
  })
  return sections
}
