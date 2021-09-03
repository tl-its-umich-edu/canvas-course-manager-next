import CanvasRequestor from '@kth/canvas-api'

import { APIErrorData, isAPIErrorData } from './api.interfaces'
import { handleAPIError, HttpMethod, makeResponse } from './api.utils'

import baseLogger from '../logger'
import { CanvasEnrollment } from '../canvas/canvas.interfaces'
import { SectionUserDto } from './dtos/api.section.users.dto'

const logger = baseLogger.child({ filePath: __filename })

export class EnrollSectionUsersApiHandler {
  requestor: CanvasRequestor
  users: SectionUserDto[]
  sectionId: number

  constructor (requestor: CanvasRequestor, users: SectionUserDto[], sectionId: number) {
    this.requestor = requestor
    this.users = users
    this.sectionId = sectionId
  }

  async enrollUser (user: SectionUserDto): Promise<CanvasEnrollment | APIErrorData> {
    const enrollLoginId = user.loginId
      .replace(/@umich\.edu$/i, '')
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

  async enrollUsers (): Promise<CanvasEnrollment[] | APIErrorData> {
    const NS_PER_SEC = BigInt(1e9)
    const start = process.hrtime.bigint()
    const apiPromises = this.users.map(async (user) => await this.enrollUser(user))
    const enrollmentResponses = await Promise.all(apiPromises)
    const end = process.hrtime.bigint()
    logger.debug(`Time elapsed to enroll (${this.users.length}) users: (${(end - start) / NS_PER_SEC}) seconds`)
    return makeResponse<CanvasEnrollment>(enrollmentResponses)
  }
}
