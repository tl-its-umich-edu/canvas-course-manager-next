import { SessionData } from 'express-session'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { handleAPIError } from './api.utils'
import { CanvasCourse, CanvasCourseBase, CanvasCourseSection, CanvasEnrollment } from '../canvas/canvas.interfaces'
import { APIErrorData, Globals } from './api.interfaces'
import { CreateSectionApiHandler } from './api.create.section.handler'
import { EnrollSectionUsersApiHandler } from './api.enroll.section.users.handler'
import { SectionUserDto } from './dtos/api.section.users.dto'
import { CanvasService } from '../canvas/canvas.service'
import { User } from '../user/user.model'

import baseLogger from '../logger'

const logger = baseLogger.child({ filePath: __filename })

@Injectable()
export class APIService {
  constructor (private readonly canvasService: CanvasService, private readonly configService: ConfigService) {}

  getGlobals (user: User, sessionData: SessionData): Globals {
    return {
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      canvasURL: this.configService.get('canvas.instanceURL') as string,
      user: {
        loginId: user.loginId,
        hasCanvasToken: user.canvasToken !== null
      },
      userLoginId: user.loginId,
      course: {
        id: sessionData.data.course.id,
        roles: sessionData.data.course.roles
      }
    }
  }

  async getCourseSections (user: User, courseId: number): Promise<CanvasCourseSection[] | APIErrorData> {
    const requestor = await this.canvasService.createRequestorForUser(user, '/api/v1/')
    try {
      const endpoint = `courses/${courseId}/sections`
      const queryParams = { include: ['total_students'] } // use list for "include" values
      logger.debug(`Sending request to Canvas (get all pages) - Endpoint: ${endpoint}; Method: GET`)
      const sectionsFull = await requestor.list<CanvasCourseSection>(endpoint, queryParams).toArray()
      logger.debug('Received response (status code unknown)')
      return sectionsFull.map(s => ({
        id: s.id,
        name: s.name,
        total_students: s.total_students
      }))
    } catch (error) {
      const errResponse = handleAPIError(error)
      return { statusCode: errResponse.canvasStatusCode, errors: [errResponse] }
    }
  }

  async getCourse (user: User, courseId: number): Promise<CanvasCourseBase | APIErrorData> {
    const requestor = await this.canvasService.createRequestorForUser(user, '/api/v1/')
    try {
      const endpoint = `courses/${courseId}`
      logger.debug(`Sending request to Canvas - Endpoint: ${endpoint}; Method: GET`)
      const response = await requestor.get<CanvasCourse>(endpoint)
      logger.debug(`Received response with status code ${response.statusCode}`)
      const course = response.body
      return { id: course.id, name: course.name, enrollment_term_id: course.enrollment_term_id }
    } catch (error) {
      const errResponse = handleAPIError(error)
      return { statusCode: errResponse.canvasStatusCode, errors: [errResponse] }
    }
  }

  async putCourseName (user: User, courseId: number, newName: string): Promise<CanvasCourseBase | APIErrorData> {
    const requestor = await this.canvasService.createRequestorForUser(user, '/api/v1/')
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
      return { id: course.id, name: course.name, enrollment_term_id: course.enrollment_term_id }
    } catch (error) {
      const errResponse = handleAPIError(error, newName)
      return { statusCode: errResponse.canvasStatusCode, errors: [errResponse] }
    }
  }

  async createSections (user: User, course: number, sections: string[]): Promise<CanvasCourseSection[] | APIErrorData> {
    const requestor = await this.canvasService.createRequestorForUser(user, '/api/v1/')
    const createSectionsApiHandler = new CreateSectionApiHandler(requestor, sections, course)
    return await createSectionsApiHandler.createSections()
  }

  async enrollSectionUsers (user: User, sectionId: number, sectionUsers: SectionUserDto[]): Promise<CanvasEnrollment[] | APIErrorData> {
    const requestor = await this.canvasService.createRequestorForUser(user, '/api/v1/')
    const enrollmentHandler = new EnrollSectionUsersApiHandler(requestor, sectionUsers, sectionId)
    return await enrollmentHandler.enrollUsers()
  }
}
