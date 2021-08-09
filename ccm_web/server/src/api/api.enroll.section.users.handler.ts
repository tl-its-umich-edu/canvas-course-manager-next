import CanvasRequestor from '@kth/canvas-api'

import { APIErrorData, isAPIErrorData } from './api.interfaces'
import { handleAPIError, HttpMethod } from './api.utils'

import baseLogger from '../logger'
import { CanvasEnrollment, CanvasUser } from '../canvas/canvas.interfaces'
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

  async getUserByLoginId (loginId: string): Promise<CanvasUser | APIErrorData> {
    try {
      const endpoint = 'accounts/1/users' // FIXME: parametrize account ID
      // According to API docs, search by email may only work for admins…
      const queryParams = { search_term: `${loginId}@umich.edu` } // FIXME: parameterize email domain

      logger.debug(`Sending request to Canvas endpoint: "${endpoint}"; queryParams: "${JSON.stringify(queryParams)}"`)
      const usersAll = await this.requestor.list<CanvasUser>(endpoint).toArray()
      logger.debug('Received response (status code unknown)')

      const users = usersAll.map(u => ({
        id: u.id,
        login_id: u.login_id
      }))
      // TODO: logic here to filter multiple responses to find one with exact `login_id`

      logger.debug([...users.entries()])

      return { id: 384537, login_id: 'canvasa' } // FIXME: replace with real value
    } catch (error) {
      logger.debug(error)
      // FIXME: This also catches non-Canvas errors in above block
      const errResponse = handleAPIError(error)
      return {
        statusCode: errResponse.canvasStatusCode,
        errors: [errResponse]
      }
    }
  }

  async enrollUser (user: SectionUserDto): Promise<CanvasEnrollment | APIErrorData> {
    try {
      const canvasUser = await this.getUserByLoginId(user.loginId)
      if (isAPIErrorData(canvasUser)) {
        throw canvasUser // FIXME: is this the best action?
      } else {
        const endpoint = `sections/${this.sectionId}/enrollments`
        const method = HttpMethod.Post
        const body = { enrollment: { user_id: canvasUser.id, type: user.type } }
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
