import CanvasRequestor from '@kth/canvas-api'

import { CanvasSectionBase, CreateSectionsAPIErrorData, APIErrorData, isAPICreateSectionErrorData } from './api.interfaces'
import { handleAPIError } from './api.utils'

import baseLogger from '../logger'

const logger = baseLogger.child({ filePath: __filename })

export class CreateSectionApiHandler {
  requestor: CanvasRequestor
  sections: string[]
  courseId: number

  constructor (requestor: CanvasRequestor, sections: string[], courseId: number) {
    this.requestor = requestor
    this.sections = sections
    this.courseId = courseId
  }

  async createSection (sectionName: string): Promise<CanvasSectionBase | CreateSectionsAPIErrorData> {
    try {
      const endpoint = `courses/${this.courseId}/sections`
      const method = 'POST'
      const requestBody = { course_section: { name: sectionName } }
      logger.debug(`Sending request to Canvas - Endpoint: ${endpoint}; Method: ${method}; Body: ${JSON.stringify(requestBody)}`)
      const response = await this.requestor.requestUrl<CanvasSectionBase>(endpoint, method, requestBody)
      const { id, name } = response.body
      return { id, name }
    } catch (error) {
      const errResponse: APIErrorData = handleAPIError(error)
      return { statusCode: errResponse.statusCode, errors: [{ message: errResponse.message, failedInput: sectionName }] }
    }
  }

  makeReturnResponseCreateSections (sectionsReturnRes: Array<CreateSectionsAPIErrorData | CanvasSectionBase>): CanvasSectionBase[] | CreateSectionsAPIErrorData {
    const successes = []; const statusCodes = []; const errorsList = []
    for (const section of sectionsReturnRes) {
      if (isAPICreateSectionErrorData(section)) {
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
        statusCode: uniqueStatusCodes.length > 1 ? 400 : uniqueStatusCodes[0],
        errors: errorsList
      }
    }
  }

  async createSections (): Promise<CanvasSectionBase[] | CreateSectionsAPIErrorData> {
    const start = process.hrtime()
    const apiPromises = this.sections.map(async (section) => await this.createSection(section))
    const sectionsOrErrorDataObjs = await Promise.all(apiPromises)
    // https://codezup.com/measure-execution-time-javascript-node-js/
    const stop = process.hrtime(start)
    logger.debug(`Time taken to create ${this.sections.length} sections: ${(stop[0] * 1e9 + stop[1]) / 1e9} seconds`)
    return this.makeReturnResponseCreateSections(sectionsOrErrorDataObjs)
  }
}
