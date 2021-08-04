import CanvasRequestor from '@kth/canvas-api'

import { APIErrorData, isAPIErrorData } from './api.interfaces'
import { handleAPIError } from './api.utils'

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

  makeResponse (enrollmentResult: Array<APIErrorData | CanvasEnrollment>): CanvasEnrollment[] | APIErrorData {
    const failures = []
    const statusCodes: Set<number> = new Set()
    const successes = []

    for (const enrollment of enrollmentResult) {
      if (isAPIErrorData(enrollment)) {
        const {
          statusCode,
          errors
        } = enrollment
        failures.push(...errors)
        statusCodes.add(statusCode)
      } else {
        successes.push(enrollment)
      }
    }

    if (successes.length === this.users.length) {
      return successes
    } else {
      return {
        statusCode: statusCodes.size > 1 ? 502 : [...statusCodes][0],
        errors: failures
      }
    }
  }

  async enrollUser (user: SectionUserDto): Promise<CanvasEnrollment | APIErrorData> {
    try {
      const endpoint = `sections/${this.sectionId}/enrollments`
      const method = 'POST'
      const body = { enrollment: { user_id: user.loginId, type: user.type } }
      logger.debug(`Sending request to Canvas endpoint: "${endpoint}"; method: "${method}"; body: "${JSON.stringify(body)}"`)
      const response = await this.requestor.requestUrl<CanvasEnrollment>(endpoint, method, body)
      const {
        id,
        course_id,
        course_section_id,
        user_id,
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
      const errorResponse = handleAPIError(error, String(user))
      return {
        statusCode: errorResponse.canvasStatusCode,
        errors: [errorResponse]
      }
    }
  }

  async enrollUsers (): Promise<CanvasEnrollment[] | APIErrorData> {
    const NS_PER_SEC = BigInt(1e9)
    const start = process.hrtime.bigint()
    const apiPromises = this.users.map(async (userLoginId) => await this.enrollUser(userLoginId))
    const enrollmentResponses = await Promise.all(apiPromises)
    const end = process.hrtime.bigint()
    logger.debug(`Time elapsed to enroll (${this.users.length}) users: (${(end - start) / NS_PER_SEC}) seconds`)
    return this.makeResponse(enrollmentResponses)
  }
}
