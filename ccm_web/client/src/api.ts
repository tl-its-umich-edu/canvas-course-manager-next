import Cookies from 'js-cookie'
import {
  CanvasCourseBase, CanvasCourseSection, CanvasCourseSectionBase, CanvasEnrollment,
  CanvasUserCondensed, CourseWithSections
} from './models/canvas.js'
import { ExternalUserSuccess } from './models/externalUser.js'
import { Globals, CsrfToken } from './models/models.js'
import handleErrors, { CanvasError } from './utils/handleErrors.js'
import { RoleEnum } from './models/models.js'

const jsonMimeType = 'application/json'

export const getCSRFToken = (): string | undefined => Cookies.get('csrftoken')

const initCSRFRequest = (headers: Array<[string, string]>): RequestInit => {
  const csrfToken = getCSRFToken()
  if (csrfToken !== undefined) headers.push(['X-CSRFTOKEN', csrfToken])
  const request: RequestInit = { headers }
  return request
}

const addStateChangeCallHeaders = (csrfToken: string): RequestInit => {
  const headers: Array<[string, string]> = [['Content-Type', jsonMimeType], ['Accept', jsonMimeType], ['x-csrf-token', csrfToken]]
  const request: RequestInit = { headers }
  return request
}

const getGet = (): RequestInit => {
  const request: RequestInit = {}
  request.method = 'GET'
  return request
}

const getPost = (body: string, csrfToken: string): RequestInit => {
  const request = addStateChangeCallHeaders(csrfToken)
  request.method = 'POST'
  request.body = body
  return request
}

const getDelete = (body: string, csrfToken: string): RequestInit => {
  const request = addStateChangeCallHeaders(csrfToken)
  request.method = 'DELETE'
  request.body = body
  return request
}

// This currently assumes all put requests have a JSON payload and receive a JSON response.
const getPut = (body: string, csrfToken: string): RequestInit => {
  // const request = addStateChangeCallHeaders(csrfToken)
  const headers: Array<[string, string]> = [['Content-Type', jsonMimeType], ['Accept', jsonMimeType]]
  const request = initCSRFRequest(headers)
  request.method = 'PUT'
  request.body = body
  return request
}

export const getCourse = async (courseId: number): Promise<CanvasCourseBase> => {
  const request = getGet()
  const resp = await fetch(`/api/course/${courseId}/`, request)
  await handleErrors(resp)
  return await resp.json()
}

export const setCourseName = async (courseId: number, newName: string, csrfToken: string): Promise<CanvasCourseBase> => {
  const request = getPut(JSON.stringify({ newName: newName }), csrfToken)
  const resp = await fetch(`/api/course/${courseId}/`, request)
  await handleErrors(resp)
  return await resp.json()
}

export const getCourseSections = async (courseId: number): Promise<CanvasCourseSection[]> => {
  const request = getGet()
  const resp = await fetch('/api/course/' + courseId.toString() + '/sections', request)
  await handleErrors(resp)
  return await resp.json()
}

export const addCourseSections = async (courseId: number, sectionNames: string[], csrfToken: string): Promise<CanvasCourseSection[]> => {
  const body = JSON.stringify({ sections: sectionNames })
  const request = getPost(body, csrfToken)
  const resp = await fetch('/api/course/' + courseId.toString() + '/sections', request)
  await handleErrors(resp)
  return await resp.json()
}

export interface AddSectionEnrollment {
  loginId: string
  role: string
}

interface AddEnrollmentWithSectionId extends AddSectionEnrollment {
  sectionId: number
}

export const getStudentsEnrolledInSection = async (sectionId: number): Promise<string[]> => {
  const request = getGet()
  const resp = await fetch(`/api/sections/${sectionId}/students`, request)
  await handleErrors(resp)
  return await resp.json()
}

export const addSectionEnrollments = async (
  sectionId: number, enrollments: AddSectionEnrollment[], csrfToken: string
): Promise<CanvasEnrollment[]> => {
  const body = JSON.stringify({ users: enrollments })
  const request = getPost(body, csrfToken)
  const resp = await fetch(`/api/sections/${sectionId}/enroll`, request)
  await handleErrors(resp)
  return await resp.json()
}

export const addEnrollmentsToSections = async (enrollments: AddEnrollmentWithSectionId[], csrfToken: string): Promise<CanvasEnrollment[]> => {
  const body = JSON.stringify({ enrollments })
  const request = getPost(body, csrfToken)
  const resp = await fetch('/api/sections/enroll', request)
  await handleErrors(resp)
  return await resp.json()
}

export const getTeacherSections = async (termId: number): Promise<CourseWithSections[]> => {
  const request = getGet()
  const resp = await fetch(`/api/instructor/sections?term_id=${termId}`, request)
  await handleErrors(resp)
  return await resp.json()
}

export const searchSections = async (termId: number, searchType: 'uniqname' | 'coursename', searchText: string): Promise<CourseWithSections[]> => {
  const request = getGet()
  const queryParam = searchType === 'uniqname' ? `instructor_name=${searchText}` : `course_name=${searchText}`
  const resp = await fetch(`/api/admin/sections?term_id=${termId}&${queryParam}`, request)
  await handleErrors(resp)
  return await resp.json()
}

export const mergeSections = async (courseId: number, sectionsToMerge: CanvasCourseSection[], csrfToken: string): Promise<CanvasCourseSectionBase[]> => {
  const body = JSON.stringify({ sectionIds: sectionsToMerge.map(section => { return section.id }) })
  const request = getPost(body, csrfToken)
  const resp = await fetch(`/api/course/${courseId}/sections/merge`, request)
  await handleErrors(resp)
  return await resp.json()
}

export const unmergeSections = async (sectionsToUnmerge: CanvasCourseSection[], csrfToken: string): Promise<CanvasCourseSectionBase[]> => {
  const body = JSON.stringify({ sectionIds: sectionsToUnmerge.map(section => { return section.id }) })
  const request = getDelete(body, csrfToken)
  const resp = await fetch('/api/sections/unmerge', request)
  await handleErrors(resp)
  return await resp.json()
}

export const getUserInfo = async (loginId: string): Promise<CanvasUserCondensed | null> => {
  const request = getGet()
  const resp = await fetch(`/api/admin/user/${loginId}`, request)
  try {
    await handleErrors(resp)
  } catch (error: unknown) {
    if (
      error instanceof CanvasError &&
      error.errors.length > 0 &&
      error.errors[0].canvasStatusCode === 404
    ) {
      return null
    } else {
      throw error
    }
  }
  return await resp.json()
}

interface ExternalUser {
  email: string
  surname: string
  givenName: string
}

export const createExternalUsers = async (newUsers: ExternalUser[], csrfToken: string): Promise<ExternalUserSuccess[]> => {
  const body = JSON.stringify({ users: newUsers })
  const request = getPost(body, csrfToken)
  const resp = await fetch('/api/admin/createExternalUsers', request)
  await handleErrors(resp)
  return await resp.json()
}
