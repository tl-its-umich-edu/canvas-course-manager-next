import { SessionData } from 'express-session'
import { HttpStatus, Injectable } from '@nestjs/common'

import { Course, Globals, HelloData } from './api.interfaces'
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

  async getCourseName (userLoginId: string, courseId: number): Promise<string | null> {
    const requestor = await this.canvasService.createRequestorForUser(userLoginId)
    let name = null
    try {
      const response = await requestor.get<Course>(`courses/${courseId}`)
      if (response.statusCode !== HttpStatus.OK) {
        logger.error(
          `Received unusual status code ${String(response.statusCode)}: `,
          JSON.stringify(response.body, null, 2)
        )
      } else {
        const course = response.body
        name = course.name
      }
    } catch (error) {
      logger.error(
        'An error occurred while making a request to Canvas: ',
        JSON.stringify(error, null, 2)
      )
      throw new Error(error)
    }
    return name
  }

  async postCourseName (userLoginId: string, courseId: number, newName: string): Promise<string | null> {
    const requestor = await this.canvasService.createRequestorForUser(userLoginId)
    let name = null
    try {
      const response = await requestor.requestUrl<Course>(
        `courses/${courseId}`, 'PUT', { course: { name: newName } }
      )
      logger.debug('Returned Request URL: ', response.requestUrl)
      logger.debug('Response body: ', JSON.stringify(response.body, null, 2))
      if (response.statusCode !== HttpStatus.OK) {
        logger.error(
          `Received unusual status code ${String(response.statusCode)}: `,
          JSON.stringify(response.body, null, 2)
        )
      } else {
        const course = response.body
        name = course.name
      }
    } catch (error) {
      logger.error(
        'An error occurred while making a request to Canvas: ',
        JSON.stringify(error, null, 2)
      )
      throw new Error(error)
    }
    return name
  }
}
