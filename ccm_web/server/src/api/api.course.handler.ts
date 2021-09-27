import CanvasRequestor from '@kth/canvas-api'

import { APIErrorData, isAPIErrorData } from './api.interfaces'
import { SectionApiHandler } from './api.section.handler'
import { handleAPIError, HttpMethod, makeResponse } from './api.utils'
import {
  CanvasCourse, CanvasCourseBase, CanvasCourseInput, CanvasCourseSection, CanvasCourseSectionBase,
  CourseWithSections
} from '../canvas/canvas.interfaces'

import baseLogger from '../logger'

const logger = baseLogger.child({ filePath: __filename })

/*
Handler class for Canvas API calls dealing with courses (i.e. those beginning with "/courses/")
or course-scoped operations that make use of other handler instances for Canvas entities
*/
export class CourseApiHandler {
  requestor: CanvasRequestor
  courseId: number

  constructor (requestor: CanvasRequestor, courseId: number) {
    this.requestor = requestor
    this.courseId = courseId
  }

  static slimCourse (course: CanvasCourse): CanvasCourseBase {
    return {
      id: course.id,
      name: course.name,
      enrollment_term_id: course.enrollment_term_id
    }
  }

  async getCourse (): Promise<CanvasCourseBase | APIErrorData> {
    try {
      const endpoint = `courses/${this.courseId}`
      logger.debug(`Sending request to Canvas - Endpoint: ${endpoint}; Method: GET`)
      const response = await this.requestor.get<CanvasCourse>(endpoint)
      logger.debug(`Received response with status code ${response.statusCode}`)
      return CourseApiHandler.slimCourse(response.body)
    } catch (error) {
      const errResponse = handleAPIError(error)
      return { statusCode: errResponse.canvasStatusCode, errors: [errResponse] }
    }
  }

  async putCourse (courseData: CanvasCourseInput): Promise<CanvasCourseBase | APIErrorData> {
    try {
      const endpoint = `courses/${this.courseId}`
      const method = HttpMethod.Put
      const requestBody = { course: courseData }
      logger.debug(
        `Sending request to Canvas - Endpoint: ${endpoint}; Method: ${method}; Body: ${JSON.stringify(requestBody)}`
      )
      const response = await this.requestor.requestUrl<CanvasCourse>(endpoint, method, requestBody)
      logger.debug(`Received response with status code ${response.statusCode}`)
      return CourseApiHandler.slimCourse(response.body)
    } catch (error) {
      const errResponse = handleAPIError(error, JSON.stringify(courseData))
      return { statusCode: errResponse.canvasStatusCode, errors: [errResponse] }
    }
  }

  async getSections (): Promise<CanvasCourseSection[] | APIErrorData> {
    try {
      const endpoint = `courses/${this.courseId}/sections`
      const queryParams = { include: ['total_students'] } // use list for "include" values
      logger.debug(`Sending request to Canvas (get all pages) - Endpoint: ${endpoint}; Method: GET`)
      const sectionsFull = await this.requestor.list<CanvasCourseSection>(endpoint, queryParams).toArray()
      logger.debug('Received response (status code unknown)')
      return sectionsFull.map(s => ({
        id: s.id,
        name: s.name,
        course_id: s.course_id,
        total_students: s.total_students
      }))
    } catch (error) {
      const errResponse = handleAPIError(error)
      return { statusCode: errResponse.canvasStatusCode, errors: [errResponse] }
    }
  }

  async getSectionsWithCourse (course: CanvasCourseBase): Promise<CourseWithSections | APIErrorData> {
    const sectionsResult = await this.getSections()
    if (isAPIErrorData(sectionsResult)) return sectionsResult
    return { ...course, sections: sectionsResult }
  }

  async createSection (sectionName: string): Promise<CanvasCourseSection | APIErrorData> {
    try {
      const endpoint = `courses/${this.courseId}/sections`
      const method = HttpMethod.Post
      const requestBody = { course_section: { name: sectionName } }
      logger.debug(`Sending request to Canvas - Endpoint: ${endpoint}; Method: ${method}; Body: ${JSON.stringify(requestBody)}`)
      const response = await this.requestor.requestUrl<CanvasCourseSection>(endpoint, method, requestBody)
      logger.debug(`Received response with status code ${response.statusCode}`)
      const newFullSection = response.body
      return { ...SectionApiHandler.slimSection(newFullSection), total_students: 0 }
    } catch (error) {
      const errResponse = handleAPIError(error, sectionName)
      return { statusCode: errResponse.canvasStatusCode, errors: [errResponse] }
    }
  }

  async createSections (sections: string[]): Promise<CanvasCourseSection[] | APIErrorData> {
    const start = process.hrtime()
    const apiPromises = sections.map(async (section) => await this.createSection(section))
    const sectionsOrErrorDataObjs = await Promise.all(apiPromises)
    // https://codezup.com/measure-execution-time-javascript-node-js/
    const stop = process.hrtime(start)
    logger.debug(`Time taken to create ${sections.length} sections: ${(stop[0] * 1e9 + stop[1]) / 1e9} seconds`)
    return makeResponse<CanvasCourseSection>(sectionsOrErrorDataObjs)
  }

  async mergeSections (sectionIds: number[]): Promise<CanvasCourseSectionBase[] | APIErrorData > {
    const NS_PER_SEC = BigInt(1e9)
    const start = process.hrtime.bigint()
    const apiPromises = sectionIds.map(async (si) => {
      const sectionHandler = new SectionApiHandler(this.requestor, si)
      return await sectionHandler.mergeSection(this.courseId)
    })
    const mergeSectionResults = await Promise.all(apiPromises)
    const bulkResult = makeResponse<CanvasCourseSectionBase>(mergeSectionResults)
    const end = process.hrtime.bigint()
    logger.debug(`Time elapsed: (${(end - start) / NS_PER_SEC}) seconds`)
    return bulkResult
  }
}
