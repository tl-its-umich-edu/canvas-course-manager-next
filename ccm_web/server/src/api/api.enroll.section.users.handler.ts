import CanvasRequestor from '@kth/canvas-api'

import { APIErrorData, isAPIErrorData } from './api.interfaces'
import { handleAPIError } from './api.utils'

import baseLogger from '../logger'
import { CanvasCourseSection } from '../canvas/canvas.interfaces'

const logger = baseLogger.child({ filePath: __filename })

export class EnrollSectionUsersApiHandler {
  requestor: CanvasRequestor
  sections: string[]
  courseId: number

  constructor (requestor: CanvasRequestor, sections: string[], courseId: number) {
    this.requestor = requestor
    this.sections = sections
    this.courseId = courseId
  }

  async createSection (sectionName: string): Promise<CanvasCourseSection | APIErrorData> {
    try {
      const endpoint = `courses/${this.courseId}/sections`
      const method = 'POST'
      const requestBody = { course_section: { name: sectionName } }
      logger.debug(`Sending request to Canvas - Endpoint: ${endpoint}; Method: ${method}; Body: ${JSON.stringify(requestBody)}`)
      const response = await this.requestor.requestUrl<CanvasCourseSection>(endpoint, method, requestBody)
      const { id, name } = response.body
      return { id, name }
    } catch (error) {
      const errResponse = handleAPIError(error, sectionName)
      return { statusCode: errResponse.canvasStatusCode, errors: [errResponse] }
    }
  }

  makeReturnResponseCreateSections (sectionsReturnRes: Array<APIErrorData | CanvasCourseSection>): CanvasCourseSection[] | APIErrorData {
    const successes = []; const statusCodes = []; const errorsList = []
    for (const section of sectionsReturnRes) {
      if (isAPIErrorData(section)) {
        const { statusCode, errors } = section
        errorsList.push(...errors)
        statusCodes.push(statusCode)
      } else {
        successes.push(section)
      }
    }

    if (successes.length === this.sections.length) {
      return successes
    } else {
      const uniqueStatusCodes = [...new Set(statusCodes)]
      return {
        statusCode: uniqueStatusCodes.length > 1 ? 502 : uniqueStatusCodes[0],
        errors: errorsList
      }
    }
  }

  async enrollUsers (): Promise<CanvasCourseSection[] | APIErrorData> {
    const NS_PER_SEC = BigInt(1e9)
    const start = process.hrtime.bigint()
    const apiPromises = this.sections.map(async (section) => await this.createSection(section))
    const sectionsOrErrorDataObjs = await Promise.all(apiPromises)
    const end = process.hrtime.bigint();
    logger.debug(`Time taken to create ${this.sections.length} sections: ${(end - start) / NS_PER_SEC} seconds`)
    return this.makeReturnResponseCreateSections(sectionsOrErrorDataObjs)
  }
}
