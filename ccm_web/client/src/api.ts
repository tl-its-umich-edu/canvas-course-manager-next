import Cookies from 'js-cookie'
import { CanvasCourseBase, CanvasCourseSection, CanvasEnrollment } from './models/canvas'
import { Globals } from './models/models'
import handleErrors from './utils/handleErrors'

const jsonMimeType = 'application/json'

export const getCSRFToken = (): string | undefined => Cookies.get('CSRF-Token')

const getGet = (): RequestInit => {
  const request: RequestInit = {}
  request.method = 'GET'
  return request
}

const getPost = (body: string): RequestInit => {
  const headers: string[][] = [['Content-Type', jsonMimeType], ['Accept', jsonMimeType]]
  const csrfToken = getCSRFToken()
  if (csrfToken !== undefined) headers.push(['CSRF-Token', csrfToken])
  const request: RequestInit = { headers }
  request.method = 'POST'
  request.body = body
  return request
}

// This currently assumes all put requests have a JSON payload and receive a JSON response.
const getPut = (body: string): RequestInit => {
  const headers: string[][] = [['Content-Type', jsonMimeType], ['Accept', jsonMimeType]]
  const csrfToken = getCSRFToken()
  if (csrfToken !== undefined) headers.push(['CSRF-Token', csrfToken])
  const request: RequestInit = { headers }
  request.method = 'PUT'
  request.body = body
  return request
}

export const getCourse = async (courseId: number): Promise<CanvasCourseBase> => {
  const request = getGet()
  const resp = await fetch(`/api/course/${courseId}`, request)
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

export const getCourseSections = async (courseId: number): Promise<CanvasCourseSection[]> => {
  const request = getGet()
  const resp = await fetch('/api/course/' + courseId.toString() + '/sections', request)
  await handleErrors(resp)
  return await resp.json()
}

export const addCourseSections = async (courseId: number, sectionNames: string[]): Promise<CanvasCourseSection[]> => {
  const body = JSON.stringify({ sections: sectionNames })
  const request = getPost(body)
  const resp = await fetch('/api/course/' + courseId.toString() + '/sections', request)
  await handleErrors(resp)
  return await resp.json()
}

export interface AddSectionEnrollment {
  loginId: string
  type: string
}

export const addSectionEnrollments = async (
  sectionId: number, enrollments: AddSectionEnrollment[]
): Promise<CanvasEnrollment> => {
  const body = JSON.stringify({ users: enrollments })
  const request = getPost(body)
  const resp = await fetch(`/api/sections/${sectionId}/enroll`, request)
  await handleErrors(resp)
  return await resp.json()
}

export const setCSRFTokenCookie = async (): Promise<void> => {
  const request = getGet()
  const resp = await fetch('/auth/csrfToken', request)
  await handleErrors(resp)
}
