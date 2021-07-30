import CanvasRequestor from '@kth/canvas-api'

import { APIErrorData, isAPIErrorData } from './api.interfaces'
import { handleAPIError } from './api.utils'

import baseLogger from '../logger'
import { CanvasEnrollment } from '../canvas/canvas.interfaces'

const logger = baseLogger.child({ filePath: __filename })

export class EnrollSectionUsersApiHandler {
  requestor: CanvasRequestor
  users: string[]
  sectionId: number

  constructor (requestor: CanvasRequestor, users: string[], sectionId: number) {
    this.requestor = requestor
    this.users = users
    this.sectionId = sectionId
  }

  makeResponse (enrollmentResult: Array<APIErrorData | CanvasEnrollment>): CanvasEnrollment[] | APIErrorData {
    const failures = [], statusCodes: Set<number> = new Set(), successes = []
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

  async enrollUser (userLoginId: string): Promise<CanvasEnrollment | APIErrorData> {
    try {
      const endpoint = `sections/${this.sectionId}/enrollments`
      const method = 'POST'
      const body = { enrollment: { user_id: userLoginId } }
      logger.debug(`Sending request to Canvas endpoint: ${endpoint}; method: ${method}; body: ${JSON.stringify(body)}`)
      const response = await this.requestor.requestUrl<CanvasEnrollment>(endpoint, method, body)
      const { id, course_id, course_section_id, user_id } = response.body
      return { id, course_id, course_section_id, user_id }
    } catch (error) {
      const errResponse = handleAPIError(error, userLoginId)
      return { statusCode: errResponse.canvasStatusCode, error: [errResponse] }
    }
  }


  async enrollUsers (): Promise<CanvasEnrollment[] | APIErrorData> {
    const NS_PER_SEC = BigInt(1e9)
    const start = process.hrtime.bigint()
    const apiPromises = this.users.map(async (userLoginId) => await this.enrollUser(userLoginId))
    const enrollmentResponses = await Promise.all(apiPromises)
    const end = process.hrtime.bigint();
    logger.debug(`Time elapsed to enroll (${this.users.length}) users: (${(end - start) / NS_PER_SEC}) seconds`)
    return this.makeEnrollmentResponse(enrollmentResponses)
  }
}
