import { SessionData } from 'express-session'
import { Injectable } from '@nestjs/common'

import { APIErrorData, CreateSectionReturnResponse, Globals, HelloData, handleAPIError } from './api.interfaces'
import { CanvasCourse, CanvasCourseBase } from '../canvas/canvas.interfaces'
import { CanvasService } from '../canvas/canvas.service'

import baseLogger from '../logger'
import { CreateSectionApiHandler } from './api.create.section.handler'

const logger = baseLogger.child({ filePath: __filename })

@Injectable()
export class APIService {
  constructor (private readonly canvasService: CanvasService) {

  }

  getHello (): HelloData {
    return {
      message: 'You successfully communicated with the backend server. Hooray!'
    }
  }

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
      const apiError = handleAPIError(error)
      logger.error(`Failed with ${apiError.statusCode} in getting  the course name due to ${apiError.message} `)
      return apiError
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
      const apiError = handleAPIError(error)
      logger.error(`Failed with ${apiError.statusCode} updading course name due to ${apiError.message} `)
      return apiError
    }
  }

  async createSections (userLoginId: string, course: number, sections: string[]): Promise<CreateSectionReturnResponse> {
    const requestor = await this.canvasService.createRequestorForUser(userLoginId, '/api/v1/')
    const createSectionsApiHandler = new CreateSectionApiHandler(requestor, sections, course)
    return await createSectionsApiHandler.createSectionBase()
  }
}
