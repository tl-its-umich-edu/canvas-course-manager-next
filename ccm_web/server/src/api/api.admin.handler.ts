import CanvasRequestor from '@kth/canvas-api'

import { CourseApiHandler } from './api.course.handler'
import { APIErrorData, isAPIErrorData } from './api.interfaces'
import { handleAPIError, limitPromises, makeResponse } from './api.utils'
import { CanvasAccount, CanvasCourse, CourseWithSections, CourseWorkflowState } from '../canvas/canvas.interfaces'

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
    const coursesApiPromises = limitPromises<CanvasCourse[] | APIErrorData>(
      accountIds.map(a => async () => await this.getAccountCourses(a, queryParams))
    )
    const coursesResponses = await Promise.all(coursesApiPromises)
    const result = makeResponse<CanvasCourse[]>(coursesResponses)
    if (isAPIErrorData(result)) return result
    const allCourses: CanvasCourse[] = []
    result.map(cs => allCourses.push(...cs))

    // Get sections for those courses
    const coursesWithSectionsApiPromises = limitPromises(
      allCourses.map(c => async () => {
        const courseHandler = new CourseApiHandler(this.requestor, c.id)
        return await courseHandler.getSectionsWithCourse(CourseApiHandler.slimCourse(c))
      })
    )
    const coursesWithSectionsResult = await Promise.all(coursesWithSectionsApiPromises)
    const finalResult = makeResponse<CourseWithSections>(coursesWithSectionsResult)

    const end = process.hrtime.bigint()
    logger.debug(`Time elapsed: (${(end - start) / NS_PER_SEC}) seconds`)
    return finalResult
  }
}
