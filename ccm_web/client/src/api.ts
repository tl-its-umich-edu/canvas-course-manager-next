import { CanvasCourseBase, CanvasCourseSection } from './models/canvas'
import { Globals } from './models/models'
import handleErrors from './utils/handleErrors'

export interface LtiProps {
  ltiKey: string | undefined
}

const jsonMimeType = 'application/json'

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

const getPost = (key: string | undefined, body: string): RequestInit => {
  const headers: string[][] = [['Content-Type', jsonMimeType], ['Accept', jsonMimeType]]
  const request = initRequest(key, headers)
  request.method = 'POST'
  request.body = body
  return request
}

// This currently assumes all put requests have a JSON payload and receive a JSON response.
const getPut = (key: string | undefined, body: string): RequestInit => {
  const headers: string[][] = [['Content-Type', jsonMimeType], ['Accept', jsonMimeType]]
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

export const getCourseSections = async (key: string | undefined, courseId: number): Promise<CanvasCourseSection[]> => {
  const request = getGet(key)
  const resp = await fetch('/api/course/' + courseId.toString() + '/sections', request)
  await handleErrors(resp)
  return await resp.json()
}

export const addCourseSections = async (key: string | undefined, courseId: number, sectionNames: string[]): Promise<CanvasCourseSection[]> => {
  const body = JSON.stringify({ sections: sectionNames })
  const request = getPost(key, body)
  const resp = await fetch('/api/course/' + courseId.toString() + '/sections', request)
  await handleErrors(resp)
  return await resp.json()
}
