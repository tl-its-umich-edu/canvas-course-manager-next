import { SessionData } from 'express-session'
import { HTTPError } from 'got'
import { Injectable } from '@nestjs/common'

import { APIErrorData, Globals } from './api.interfaces'
import { CanvasCourse, CanvasCourseBase, CanvasCourseSection } from '../canvas/canvas.interfaces'
import { CanvasService } from '../canvas/canvas.service'

import baseLogger from '../logger'

const logger = baseLogger.child({ filePath: __filename })

@Injectable()
export class APIService {
  constructor (private readonly canvasService: CanvasService) {}

  getGlobals (sessionData: SessionData): Globals {
    return {
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      userLoginId: sessionData.data.userLoginId,
      course: {
        id: sessionData.data.course.id,
        roles: sessionData.data.course.roles
      }
    }
  }

  static handleAPIError (error: unknown): APIErrorData {
    if (error instanceof HTTPError) {
      const { statusCode, body } = error.response
      logger.error(`Received unusual status code ${String(statusCode)}`)
      logger.error(`Response body: ${JSON.stringify(body)}`)
      return { statusCode, message: `Error(s) from Canvas: ${CanvasService.parseErrorBody(body)}` }
    } else {
      logger.error(`An error occurred while making a request to Canvas: ${JSON.stringify(error)}`)
      return { statusCode: 500, message: 'A non-HTTP error occurred while communicating with Canvas.' }
    }
  }

  async getCourseSections(userLoginId: string, courseId: number): Promise<CanvasCourseSection[] | APIErrorData> {
    const requestor = await this.canvasService.createRequestorForUser(userLoginId, '/api/v1/')
    try {
      const endpoint = `courses/${courseId}/sections`
      const queryParams = {'include': ['total_students']} // use list for "include" values
      logger.debug(`Sending request to Canvas (get all pages) - Endpoint: ${endpoint}; Method: GET`)
      // FIXME: list() should return promise, toArray() should be callable later
      const sectionsFull = await requestor.list<CanvasCourseSection>(endpoint, queryParams).toArray()
      // FIXME: no access to got Response; statusCode, etc. not available!
      // logger.debug(`Received response with status code ${sectionsFull.statusCode}`) // broken
      const sections = sectionsFull.map(s => ({
        id: s.id,
        name: s.name,
        total_students: s.total_students
      }))

      return sections
    } catch (error) {
      return APIService.handleAPIError(error)
    }
  }

  async getCourseName (userLoginId: string, courseId: number): Promise<CanvasCourseBase | APIErrorData> {
    const requestor = await this.canvasService.createRequestorForUser(userLoginId, '/api/v1/')
    try {
      const endpoint = `courses/${courseId}`
      logger.debug(`Sending request to Canvas - Endpoint: ${endpoint}; Method: GET`)
      const response = await requestor.get<CanvasCourse>(endpoint)
      logger.debug(`Received response with status code ${response.statusCode}`)
      const course = response.body
      return { id: course.id, name: course.name }
    } catch (error) {
      return APIService.handleAPIError(error)
    }
  }

  async putCourseName (userLoginId: string, courseId: number, newName: string): Promise<CanvasCourseBase | APIErrorData> {
    const requestor = await this.canvasService.createRequestorForUser(userLoginId, '/api/v1/')
    try {
      const endpoint = `courses/${courseId}`
      const method = 'PUT'
      const requestBody = { course: { name: newName, course_code: newName } }
      logger.debug(
        `Sending request to Canvas - Endpoint: ${endpoint}; Method: ${method}; Body: ${JSON.stringify(requestBody)}`
      )
      const response = await requestor.requestUrl<CanvasCourse>(endpoint, method, requestBody)
      logger.debug(`Received response with status code ${response.statusCode}`)
      const course = response.body
      return { id: course.id, name: course.name }
    } catch (error) {
      return APIService.handleAPIError(error)
    }
  }
}
