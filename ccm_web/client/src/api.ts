import { CanvasCourseBase } from './models/canvas'
import { Globals } from './models/models'
import handleErrors from './utils/handleErrors'

// TO DO: Look at how this can be repurposed for CSRF
// const initRequest = (key: string | undefined, headers: string[][] = []): RequestInit => {
//   if (key !== undefined) {
//     headers.push(['Authorization', 'Bearer ' + key])
//     return {
//       credentials: 'include',
//       headers: headers
//     }
//   }
//   return { headers }
// }

const getGet = (): RequestInit => {
  const request: RequestInit = {}
  request.method = 'GET'
  return request
}

// This currently assumes all put requests have a JSON payload and receive a JSON response.
const getPut = (body: string): RequestInit => {
  const headers: string[][] = []
  headers.push(['Content-Type', 'application/json'])
  headers.push(['Accept', 'application/json'])
  const request: RequestInit = { headers }
  request.method = 'PUT'
  request.body = body
  return request
}

export const getCourse = async (courseId: number): Promise<CanvasCourseBase> => {
  const request = getGet()
  const resp = await fetch(`/api/course/${courseId}/name`, request)
  await handleErrors(resp)
  return await resp.json()
}

export const setCourseName = async (courseId: number, newName: string): Promise<CanvasCourseBase> => {
  const request = getPut(JSON.stringify({ newName: newName }))
  const resp = await fetch(`/api/course/${courseId}/name`, request)
  await handleErrors(resp)
  return await resp.json()
}

export const getGlobals = async (): Promise<Globals> => {
  const request = getGet()
  const resp = await fetch('/api/globals', request)
  await handleErrors(resp)
  return await resp.json()
}

const delay = async (ms: number): Promise<void> => {
  await new Promise<void>(resolve => setTimeout(() => resolve(), ms))
}

// This is a placeholder for a real implementation (I mean, obviously :D)
export const getCourseSections = async (courseId: string): Promise<string[]> => {
  const sections = await delay(2000).then(() => {
    if (Math.random() * 3 > 1) {
      return (['AAAA', 'BBBB'])
    } else {
      return new Promise<string[]>((resolve, reject) => { reject(new Error('Error retrieving course section information.')) })
    }
  })
  return sections
}
