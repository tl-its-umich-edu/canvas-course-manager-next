import CanvasRequestor from '@kth/canvas-api'

import { APIErrorData } from './api.interfaces'
import { createLimitedPromises, handleAPIError, HttpMethod, makeResponse } from './api.utils'
import { SectionUserDto } from './dtos/api.section.users.dto'
import {
  CanvasCourseSection, CanvasCourseSectionBase, CanvasEnrollment, CanvasEnrollmentWithUser, UserEnrollmentType, CustomCanvasRoleType
} from '../canvas/canvas.interfaces'

import baseLogger from '../logger'
import { CustomCanvasRoleData } from '../config'

const logger = baseLogger.child({ filePath: __filename })

/*
Handler class for Canvas API calls dealing with a specific section (i.e. those beginning with "/sections/:id")
*/
export class SectionApiHandler {
  requestor: CanvasRequestor
  sectionId: number
  customCanvasRoles?: CustomCanvasRoleData

  constructor (requestor: CanvasRequestor, sectionId: number, customCanvasRoles?: CustomCanvasRoleData) {
    this.requestor = requestor
    this.sectionId = sectionId
    this.customCanvasRoles = customCanvasRoles
  }

  static slimSection (section: CanvasCourseSection): CanvasCourseSectionBase {
    return {
      id: section.id,
      name: section.name,
      course_id: section.course_id,
      nonxlist_course_id: section.nonxlist_course_id
    }
  }

  async getStudentsEnrolled (): Promise<string[] | APIErrorData> {
    const queryParams = { type: [UserEnrollmentType.StudentEnrollment] }
    let enrollmentsResult
    try {
      const endpoint = `sections/${this.sectionId}/enrollments`
      logger.debug(`Sending request to Canvas endpoint: "${endpoint}"; method: "${HttpMethod.Get}"`)
      enrollmentsResult = await this.requestor.listItems<CanvasEnrollmentWithUser>(endpoint, queryParams).toArray()
      logger.debug('Received response (status code unknown)')
    } catch (error) {
      const errResponse = handleAPIError(error)
      return { statusCode: errResponse.canvasStatusCode, errors: [errResponse] }
    }
    return enrollmentsResult.map(e => e.user.login_id)
  }

  async enrollUser (user: SectionUserDto): Promise<CanvasEnrollment | APIErrorData> {
    const enrollLoginId = user.loginId
      .replace(/@([^@.]+\.)*umich\.edu$/gi, '')
      .replace('@', '+')
    const enrollmentType = user.type
    const roleParams = (
      this.customCanvasRoles !== undefined &&
      Object.values(CustomCanvasRoleType).includes(String(enrollmentType)) &&
      Object.keys(this.customCanvasRoles).includes(String(enrollmentType))
    )
      ? { role_id: this.customCanvasRoles[enrollmentType] }
      : { type: enrollmentType }

    try {
      const endpoint = `sections/${this.sectionId}/enrollments`
      const method = HttpMethod.Post
      const enrollment = {
        // 'sis_login_id:' prefix per...
        // https://canvas.instructure.com/doc/api/file.object_ids.html
        user_id: `sis_login_id:${enrollLoginId}`,
        enrollment_state: 'active',
        ...roleParams
      }

      const body = { enrollment }
      logger.debug(`Sending request to Canvas endpoint: "${endpoint}"; method: "${method}"; body: "${JSON.stringify(body)}"`)
      const response = await this.requestor.request<CanvasEnrollment>(endpoint, method, body)
      logger.debug(`Received response with status code ${response.statusCode}`)
      const {
        id,
        course_id, // eslint-disable-line
        course_section_id, // eslint-disable-line
        user_id, // eslint-disable-line
        type
      } = response.body
      return {
        id,
        course_id,
        course_section_id,
        user_id,
        type
      }
    } catch (error) {
      const errorResponse = handleAPIError(error, `Login ID: ${user.loginId}; Role: ${user.type}`)
      return {
        statusCode: errorResponse.canvasStatusCode,
        errors: [errorResponse]
      }
    }
  }

  async enrollUsers (users: SectionUserDto[]): Promise<CanvasEnrollment[] | APIErrorData> {
    const NS_PER_SEC = BigInt(1e9)
    const start = process.hrtime.bigint()
    const apiPromises = createLimitedPromises<CanvasEnrollment | APIErrorData>(
      users.map(user => async () => await this.enrollUser(user))
    )
    const enrollmentResponses = await Promise.all(apiPromises)
    const end = process.hrtime.bigint()
    logger.debug(`Time elapsed to enroll (${users.length}) users: (${(end - start) / NS_PER_SEC}) seconds`)
    return makeResponse<CanvasEnrollment>(enrollmentResponses)
  }

  async mergeSection (targetCourseId: number): Promise<CanvasCourseSectionBase | APIErrorData> {
    try {
      const endpoint = `sections/${this.sectionId}/crosslist/${targetCourseId}`
      const method = HttpMethod.Post
      logger.debug(`Sending request to Canvas endpoint: "${endpoint}"; method: "${method}"`)
      const response = await this.requestor.request<CanvasCourseSection>(endpoint, method)
      logger.debug(`Received response with status code ${response.statusCode}`)
      return SectionApiHandler.slimSection(response.body)
    } catch (error) {
      const errResponse = handleAPIError(error)
      return { statusCode: errResponse.canvasStatusCode, errors: [errResponse] }
    }
  }

  async unmergeSection (): Promise<CanvasCourseSectionBase | APIErrorData> {
    try {
      const endpoint = `sections/${this.sectionId}/crosslist`
      const method = HttpMethod.Delete
      logger.debug(`Sending request to Canvas endpoint: "${endpoint}"; method: "${method}"`)
      const response = await this.requestor.request<CanvasCourseSection>(endpoint, method)
      logger.debug(`Received response with status code ${response.statusCode}`)
      return SectionApiHandler.slimSection(response.body)
    } catch (error) {
      const errResponse = handleAPIError(error)
      return { statusCode: errResponse.canvasStatusCode, errors: [errResponse] }
    }
  }
}
