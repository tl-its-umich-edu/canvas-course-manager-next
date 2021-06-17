import { SessionData } from 'express-session'
import { HTTPError } from 'got'
import { Injectable } from '@nestjs/common'

import { APIErrorData, Globals, HelloData } from './api.interfaces'
import { CanvasCourse, CanvasCourseBase } from '../canvas/canvas.interfaces'
import { CanvasService } from '../canvas/canvas.service'

import baseLogger from '../logger'

const logger = baseLogger.child({ filePath: __filename })

@Injectable()
export class APIService {
  constructor (private readonly canvasService: CanvasService) {}

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

  static handleAPIError (error: unknown): APIErrorData {
    if (error instanceof HTTPError) {
      const { statusCode, body } = error.response
      logger.error(`Received unusual status code ${String(error.response.statusCode)}`)
      logger.error(`Response body: ${JSON.stringify(error.response.body)}`)
      return { statusCode, message: `Error(s) from Canvas: ${CanvasService.parseErrorBody(body)}` }
    } else {
      logger.error(`An error occurred while making a request to Canvas: ${JSON.stringify(error)}`)
      return { statusCode: 500, message: 'A Non-HTTP error occurred while communicating with Canvas.' }
    }
  }

  async getCourseName (userLoginId: string, courseId: number): Promise<CanvasCourseBase | APIErrorData> {
    const requestor = await this.canvasService.createRequestorForUser(userLoginId, '/api/v1/')
    try {
      const response = await requestor.get<CanvasCourse>(`courses/${courseId}`)
      const course = response.body
      return { id: course.id, name: course.name }
    } catch (error) {
      return APIService.handleAPIError(error)
    }
  }

  async putCourseName (userLoginId: string, courseId: number, newName: string): Promise<CanvasCourseBase | APIErrorData> {
    const requestor = await this.canvasService.createRequestorForUser(userLoginId, '/api/v1/')
    try {
      const response = await requestor.requestUrl<CanvasCourse>(
        `courses/${courseId}`, 'PUT', { course: { name: newName, course_code: newName } }
      )
      const course = response.body
      return { id: course.id, name: course.name }
    } catch (error) {
      return APIService.handleAPIError(error)
    }
  }
}
