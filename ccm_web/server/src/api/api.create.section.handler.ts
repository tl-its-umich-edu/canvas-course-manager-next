import CanvasRequestor from '@kth/canvas-api'
import baseLogger from '../logger'
import { CreateSectionResponseData, CreateSectionReturnResponse, CanvasSectionBase, CreateSectionsResponseObject, APIErrorData, handleAPIError } from './api.interfaces'

const logger = baseLogger.child({ filePath: __filename })

export class CreateSectionApiHandler {
  constructor (private readonly requestor: CanvasRequestor,
    private readonly sections: string[],
    private readonly courseId: number) {}

  async apiCreateSection (sectionName: string): Promise<CreateSectionsResponseObject> {
    try {
      const fake = `courses/${this.courseId}/sections/ding/dong`
      const real = `courses/${this.courseId}/sections`
      const endpoint = Math.random() < 0.5 ? real : fake
      const method = 'POST'
      const requestBody = { course_section: { name: sectionName } }
      logger.debug(`Sending request to Canvas - Endpoint: ${endpoint}; Method: ${method}; Body: ${JSON.stringify(requestBody)}`)
      const response = await this.requestor.requestUrl<CanvasSectionBase>(endpoint, method, requestBody)
      return { statusCode: response.statusCode, message: response.statusMessage as string, sectionName: response.body.name }
    } catch (error) {
      const errResponse: APIErrorData = handleAPIError(error)
      logger.error(`Request to create section ${sectionName} failed with StatusCode: ${errResponse.statusCode} and StatusMessage: ${errResponse.message} `)
      return { statusCode: errResponse.statusCode, message: errResponse.message, sectionName: sectionName }
    }
  }

  makeReturnResponseCreateSections (sectionsReturnRes: CreateSectionsResponseObject[]): CreateSectionReturnResponse {
    const sectionsDataStore: CreateSectionResponseData = { createdSections: 0, givenSections: this.sections.length, statusCode: [], error: {} }
    for (const section of sectionsReturnRes) {
      const { statusCode, message, sectionName } = section
      if (statusCode === 200 || statusCode === 201) {
        sectionsDataStore.createdSections++
      } else {
        sectionsDataStore.error[sectionName] = message
        sectionsDataStore.statusCode.push(statusCode)
      }
    }

    if (sectionsDataStore.createdSections === sectionsDataStore.givenSections) {
      return { statusCode: 201, message: { section: { success: true } } }
    } else {
      return {
        statusCode: Math.max(...[...new Set(sectionsDataStore.statusCode)]),
        message: { section: { success: false, error: sectionsDataStore.error } }
      }
    }
  }

  async createSectionBase (): Promise<CreateSectionReturnResponse> {
    const start = process.hrtime()
    const apiPromises = this.sections.map(async (section) => await this.apiCreateSection(section))
    const sectionsOrErrorDataObjs = await Promise.all(apiPromises)
    const stop = process.hrtime(start)
    logger.info(`Time Taken to ${this.sections.length} create sections : ${(stop[0] * 1e9 + stop[1]) / 1e9} seconds`)
    return this.makeReturnResponseCreateSections(sectionsOrErrorDataObjs)
  }
}