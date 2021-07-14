import CanvasRequestor from '@kth/canvas-api'

import { CreateSectionTempDataStore, CanvasSectionBase, CreateSectionsAPIErrorData, APIErrorData, isAPICreateSectionErrorData } from './api.interfaces'
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

  async apiCreateSection (sectionName: string): Promise<CanvasSectionBase | CreateSectionsAPIErrorData> {
    try {
      const endpoint = `courses/${this.courseId}/sections/ding`
      const method = 'POST'
      const requestBody = { course_section: { name: sectionName } }
      logger.debug(`Sendings request to Canvas - Endpoint: ${endpoint}; Method: ${method}; Body: ${JSON.stringify(requestBody)}`)
      const response = await this.requestor.requestUrl<CanvasSectionBase>(endpoint, method, requestBody)
      const { id, name } = response.body
      return { id, name }
    } catch (error) {
      const errResponse: APIErrorData = handleAPIError(error)
      return { statusCode: errResponse.statusCode, errors: [{ message: errResponse.message, failedInput: sectionName }] }
    }
  }

  makeReturnResponseCreateSections (sectionsReturnRes: Array<CreateSectionsAPIErrorData | CanvasSectionBase>): CanvasSectionBase[] | CreateSectionsAPIErrorData {
    const sectionsDataStore: CreateSectionTempDataStore = { allSuccess: [], statusCode: [], errors: [] }
    for (const section of sectionsReturnRes) {
      if (isAPICreateSectionErrorData(section)) {
        const { statusCode, errors } = section
        sectionsDataStore.errors.push(errors[0])
        sectionsDataStore.statusCode.push(statusCode)
      } else {
        sectionsDataStore.allSuccess.push(section)
      }
    }

    if (sectionsDataStore.allSuccess.length === this.sections.length) {
      return sectionsDataStore.allSuccess
    } else {
      const statusCodes = [...new Set(sectionsDataStore.statusCode)]
      const statusCode = [...new Set(sectionsDataStore.statusCode)].length > 1 ? 400 : statusCodes[0]
      return {
        statusCode: statusCode,
        errors: sectionsDataStore.errors
      }
    }
  }

  async createSectionBase (): Promise<CanvasSectionBase[] | CreateSectionsAPIErrorData> {
    const start = process.hrtime()
    const apiPromises = this.sections.map(async (section) => await this.apiCreateSection(section))
    const sectionsOrErrorDataObjs = await Promise.all(apiPromises)
    const stop = process.hrtime(start)
    logger.debug(`Time taken to create ${this.sections.length} sections: ${(stop[0] * 1e9 + stop[1]) / 1e9} seconds`)
    return this.makeReturnResponseCreateSections(sectionsOrErrorDataObjs)
  }
}
