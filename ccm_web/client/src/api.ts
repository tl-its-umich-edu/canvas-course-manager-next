import Cookies from 'js-cookie'
import { CanvasCourseBase, CanvasCourseSection, CanvasEnrollment, CanvasCourseSectionBase, CourseWithSections } from './models/canvas'
import { Globals } from './models/models'
import handleErrors, { CanvasError } from './utils/handleErrors'

const jsonMimeType = 'application/json'

export const getCSRFToken = (): string | undefined => Cookies.get('CSRF-Token')

const initCSRFRequest = (headers: string[][]): RequestInit => {
  const csrfToken = getCSRFToken()
  if (csrfToken !== undefined) headers.push(['CSRF-Token', csrfToken])
  const request: RequestInit = { headers }
  return request
}

const getGet = (): RequestInit => {
  const request: RequestInit = {}
  request.method = 'GET'
  return request
}

const getPost = (body: string): RequestInit => {
  const headers: string[][] = [['Content-Type', jsonMimeType], ['Accept', jsonMimeType]]
  const request = initCSRFRequest(headers)
  request.method = 'POST'
  request.body = body
  return request
}

const getDelete = (body: string): RequestInit => {
  const headers: string[][] = [['Content-Type', jsonMimeType], ['Accept', jsonMimeType]]
  const request = initCSRFRequest(headers)
  request.method = 'DELETE'
  request.body = body
  return request
}

// This currently assumes all put requests have a JSON payload and receive a JSON response.
const getPut = (body: string): RequestInit => {
  const headers: string[][] = [['Content-Type', jsonMimeType], ['Accept', jsonMimeType]]
  const request = initCSRFRequest(headers)
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
  sectionId: number, enrollments: AddSectionEnrollment[]
): Promise<CanvasEnrollment[]> => {
  const body = JSON.stringify({ users: enrollments })
  const request = getPost(body)
  const resp = await fetch(`/api/sections/${sectionId}/enroll`, request)
  await handleErrors(resp)
  return await resp.json()
}

export const addEnrollmentsToSections = async (enrollments: AddEnrollmentWithSectionId[]): Promise<CanvasEnrollment[]> => {
  const body = JSON.stringify({ enrollments })
  const request = getPost(body)
  const resp = await fetch('/api/sections/enroll', request)
  await handleErrors(resp)
  return await resp.json()
}

export const setCSRFTokenCookie = async (): Promise<void> => {
  const request = getGet()
  const resp = await fetch('/auth/csrfToken', request)
  await handleErrors(resp)
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

export const mergeSections = async (courseId: number, sectionsToMerge: CanvasCourseSection[]): Promise<CanvasCourseSectionBase[]> => {
  const body = JSON.stringify({ sectionIds: sectionsToMerge.map(section => { return section.id }) })
  const request = getPost(body)
  const resp = await fetch(`/api/course/${courseId}/sections/merge`, request)
  await handleErrors(resp)
  return await resp.json()
}

export const unmergeSections = async (sectionsToUnmerge: CanvasCourseSection[]): Promise<CanvasCourseSectionBase[]> => {
  const body = JSON.stringify({ sectionIds: sectionsToUnmerge.map(section => { return section.id }) })
  const request = getDelete(body)
  const resp = await fetch('/api/sections/unmerge', request)
  await handleErrors(resp)
  return await resp.json()
}

export const checkIfUserExists = async (loginId: string): Promise<boolean> => {
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
      return false
    } else {
      throw error
    }
  }
  return true
}
