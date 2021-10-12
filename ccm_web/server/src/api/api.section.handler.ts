import CanvasRequestor from '@kth/canvas-api'

import { APIErrorData } from './api.interfaces'
import { handleAPIError, HttpMethod, makeResponse } from './api.utils'
import { SectionUserDto } from './dtos/api.section.users.dto'
import { CanvasCourseSection, CanvasCourseSectionBase, CanvasEnrollment } from '../canvas/canvas.interfaces'

import baseLogger from '../logger'

const logger = baseLogger.child({ filePath: __filename })

/*
Handler class for Canvas API calls dealing with a specific section (i.e. those beginning with "/sections/:id")
*/
export class SectionApiHandler {
  requestor: CanvasRequestor
  sectionId: number

  constructor (requestor: CanvasRequestor, sectionId: number) {
    this.requestor = requestor
    this.sectionId = sectionId
  }

  static slimSection (section: CanvasCourseSection): CanvasCourseSectionBase {
    return {
      id: section.id,
      name: section.name,
      course_id: section.course_id,
      nonxlist_course_id: section.nonxlist_course_id
    }
  }

  async enrollUser (user: SectionUserDto): Promise<CanvasEnrollment | APIErrorData> {
    const enrollLoginId = user.loginId
      .replace(/@([^@.]+\.)*umich\.edu$/gi, '')
      .replace('@', '+')

    try {
      const endpoint = `sections/${this.sectionId}/enrollments`
      const method = HttpMethod.Post
      const body = {
        enrollment: {
          // 'sis_login_id:' prefix per...
          // https://canvas.instructure.com/doc/api/file.object_ids.html
          user_id: `sis_login_id:${enrollLoginId}`,
          type: user.type,
          enrollment_state: 'active',
          notify: false
        }
      }
      logger.debug(`Sending request to Canvas endpoint: "${endpoint}"; method: "${method}"; body: "${JSON.stringify(body)}"`)
      const response = await this.requestor.requestUrl<CanvasEnrollment>(endpoint, method, body)
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
      const errorResponse = handleAPIError(error, JSON.stringify(user))
      return {
        statusCode: errorResponse.canvasStatusCode,
        errors: [errorResponse]
      }
    }
  }

  async enrollUsers (users: SectionUserDto[]): Promise<CanvasEnrollment[] | APIErrorData> {
    const NS_PER_SEC = BigInt(1e9)
    const start = process.hrtime.bigint()
    const apiPromises = users.map(async (user) => await this.enrollUser(user))
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
      const response = await this.requestor.requestUrl<CanvasCourseSection>(endpoint, method)
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
      const response = await this.requestor.requestUrl<CanvasCourseSection>(endpoint, method)
      logger.debug(`Received response with status code ${response.statusCode}`)
      return SectionApiHandler.slimSection(response.body)
    } catch (error) {
      const errResponse = handleAPIError(error)
      return { statusCode: errResponse.canvasStatusCode, errors: [errResponse] }
    }
  }
}
