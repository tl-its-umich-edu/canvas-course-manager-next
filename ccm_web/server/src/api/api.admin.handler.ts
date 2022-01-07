import CanvasRequestor from '@kth/canvas-api'

import { CourseApiHandler } from './api.course.handler'
import { APIErrorData, isAPIErrorData } from './api.interfaces'
import { handleAPIError, HttpMethod, makeResponse } from './api.utils'
import { SectionExternalUserDto } from './dtos/api.section.external.users.dto'
import {
  CanvasAccount,
  CanvasCourse,
  CanvasUser,
  CanvasUserLoginEmail,
  CourseWithSections,
  CourseWorkflowState
} from '../canvas/canvas.interfaces'

import baseLogger from '../logger'

const logger = baseLogger.child({ filePath: __filename })

interface AccountCoursesQueryParams extends Record<string, unknown> {
  'state': CourseWorkflowState[]
  'enrollment_term_id': number
  'per_page'?: number
  'search_term'?: string
  'by_teachers'?: string[]
}

/*
Handler class for Canvas API calls dealing with an admin's accounts (i.e. those beginning with "/accounts/")
or account-scoped operations that make use of other handler instances for Canvas entities
*/
export class AdminApiHandler {
  requestor: CanvasRequestor
  userLoginId: string

  constructor (requestor: CanvasRequestor, userLoginId: string) {
    this.requestor = requestor
    this.userLoginId = userLoginId
  }

  async getParentAccounts (): Promise<CanvasAccount[] | APIErrorData> {
    let accounts: CanvasAccount[] = []
    try {
      const endpoint = 'accounts'
      logger.debug(`Sending request to Canvas (get all pages) - Endpoint: ${endpoint}; Method: GET`)
      accounts = await this.requestor.listItems<CanvasAccount>(endpoint).toArray()
      logger.debug('Received response (status code unknown)')
    } catch (error) {
      const errResponse = handleAPIError(error)
      return { statusCode: errResponse.canvasStatusCode, errors: [errResponse] }
    }
    const accountIds = accounts.map(a => a.id)
    const parentAccounts = accounts.filter(a => {
      return (
        a.parent_account_id === null || // The account is the root account
        !accountIds.includes(a.parent_account_id) // The account's parent is not in the list of account IDs
      )
    })
    logger.debug(
      `User ${this.userLoginId} is an admin for these accounts ` +
      `and their children: ${JSON.stringify(parentAccounts, null, 2)}`
    )
    return parentAccounts
  }

  async getAccountCourses (
    accountId: number, queryParams: AccountCoursesQueryParams
  ): Promise<CanvasCourse[] | APIErrorData> {
    try {
      const endpoint = `accounts/${accountId}/courses`
      logger.debug(`Sending request to Canvas (get all pages) - Endpoint: ${endpoint}; Method: GET`)
      const courses = await this.requestor.listItems<CanvasCourse>(endpoint, queryParams).toArray()
      logger.debug('Received response (status code unknown)')
      return courses
    } catch (error) {
      const errResponse = handleAPIError(error)
      return { statusCode: errResponse.canvasStatusCode, errors: [errResponse] }
    }
  }

  async getCourseSectionsInTerm (
    accountIds: number[], termId: number, instructor: string | undefined, courseName: string | undefined
  ): Promise<CourseWithSections[] | APIErrorData> {
    const NS_PER_SEC = BigInt(1e9)
    const start = process.hrtime.bigint()

    // Get courses in accounts they are an admin for -- filtering by course state, term, instructor, and search term
    const queryParams: AccountCoursesQueryParams = {
      state: [CourseWorkflowState.Created, CourseWorkflowState.Claimed, CourseWorkflowState.Available],
      enrollment_term_id: termId,
      per_page: 100
    }
    if (instructor !== undefined) queryParams.by_teachers = ['sis_login_id:' + instructor]
    if (courseName !== undefined) queryParams.search_term = courseName
    const coursesApiPromises = accountIds.map(async (a) => await this.getAccountCourses(a, queryParams))
    const coursesResponses = await Promise.all(coursesApiPromises)
    const result = makeResponse<CanvasCourse[]>(coursesResponses)
    if (isAPIErrorData(result)) return result
    const allCourses: CanvasCourse[] = []
    result.map(cs => allCourses.push(...cs))

    // Get sections for those courses
    const coursesWithSectionsApiPromises = allCourses.map(async c => {
      const courseHandler = new CourseApiHandler(this.requestor, c.id)
      return await courseHandler.getSectionsWithCourse(CourseApiHandler.slimCourse(c))
    })
    const coursesWithSectionsResult = await Promise.all(coursesWithSectionsApiPromises)
    const finalResult = makeResponse<CourseWithSections>(coursesWithSectionsResult)

    const end = process.hrtime.bigint()
    logger.debug(`Time elapsed: (${(end - start) / NS_PER_SEC}) seconds`)
    return finalResult
  }

  async createExternalUser (user: SectionExternalUserDto, accountID: number): Promise<CanvasUserLoginEmail | APIErrorData> {
    const email = user.email
    const loginId = email.replace('@', '+')

    try {
      const endpoint = `accounts/${accountID}/users`
      const method = HttpMethod.Post
      const body = {
        user: {
          // API doesn't provide separate given- and surname fields
          name: `${user.givenName} ${user.surname}`,
          sortable_name: `${user.surname}, ${user.givenName}`,
          terms_of_use: true,
          skip_registration: true
        },
        pseudonym: {
          unique_id: loginId,
          send_confirmation: false
        },
        communication_channel: {
          type: 'email',
          address: email,
          skip_confirmation: true
        },
        force_validations: false
      }
      logger.debug(`Sending admin request to Canvas endpoint: "${endpoint}"; method: "${method}"; body: "${JSON.stringify(body)}"`)
      const response = await this.requestor.request<CanvasUserLoginEmail>(endpoint, method, body)
      logger.debug(`Received response with status code (${String(response.statusCode)})`)
      const {
        id,
        name,
        sortable_name, // eslint-disable-line
        short_name, // eslint-disable-line
        login_id // eslint-disable-line
      } = response.body
      return {
        id,
        name,
        sortable_name,
        short_name,
        login_id,
        email
      }
    } catch (error) {
      const errorResponse = handleAPIError(error, `Login ID: ${loginId}; Role: ${user.type}`)
      return {
        statusCode: errorResponse.canvasStatusCode,
        errors: [errorResponse]
      }
    }
  }

  async createExternalUsers (users: SectionExternalUserDto[], accountID: number): Promise<Array<CanvasUserLoginEmail | APIErrorData>> {
    const NS_PER_SEC = BigInt(1e9)
    const start = process.hrtime.bigint()

    // Try creating all Canvas users; failure means user already exists
    const createUserPromises = users.map(async (user) => await this.createExternalUser(user, accountID))
    const createUserResponses = await Promise.all(createUserPromises)

    const end = process.hrtime.bigint()
    logger.debug(`Time elapsed to create (${users.length}) external users: (${(end - start) / NS_PER_SEC}) seconds`)

    return createUserResponses
  }

  async getUserInfo (loginId: string): Promise<CanvasUser | APIErrorData> {
    const safeLoginId = loginId.replace('@', '+')

    try {
      const endpoint = `users/sis_login_id:${safeLoginId}`
      const method = HttpMethod.Get
      logger.debug(`Sending admin request to Canvas endpoint: "${endpoint}"; method: "${method}"`)
      const response = await this.requestor.get<CanvasUser>(endpoint)
      logger.debug(`Received response with status code (${String(response.statusCode)})`)
      const {
        id,
        name,
        sortable_name, // eslint-disable-line
        short_name // eslint-disable-line
      } = response.body
      return {
        id,
        name,
        sortable_name,
        short_name,
      }
    } catch (error) {
      const errorResponse = handleAPIError(error, `Login ID: ${loginId}`)
      return {
        statusCode: errorResponse.canvasStatusCode,
        errors: [errorResponse]
      }
    }
  }
}
