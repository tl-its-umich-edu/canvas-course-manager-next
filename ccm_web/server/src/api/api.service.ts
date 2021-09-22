import { SessionData } from 'express-session'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { AdminApiHandler } from './api.admin.handler'
import { CourseApiHandler } from './api.course.handler'
import { EnrollSectionUsersApiHandler } from './api.enroll.section.users.handler'
import { APIErrorData, Globals } from './api.interfaces'
import { SectionUserDto } from './dtos/api.section.users.dto'
import { handleAPIError, makeResponse } from './api.utils'
import {
  CanvasCourse, CanvasCourseBase, CanvasCourseSection, CanvasEnrollment, CourseWithSections
} from '../canvas/canvas.interfaces'
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
    const courseHandler = new CourseApiHandler(requestor, courseId)
    return await courseHandler.getSections()
  }

  async getCourseSectionsInTermAsInstructor (
    user: User, termId: number
  ): Promise<CourseWithSections[] | APIErrorData> {
    const requestor = await this.canvasService.createRequestorForUser(user, '/api/v1/')
    let courses: CanvasCourse[] = []
    try {
      const endpoint = 'courses'
      const queryParams = { enrollment_type: 'teacher' }
      logger.debug(`Sending request to Canvas (get all pages) - Endpoint: ${endpoint}; Method: GET`)
      courses = await requestor.list<CanvasCourse>(endpoint, queryParams).toArray()
      logger.debug('Received response (status code unknown)')
    } catch (error) {
      const errResponse = handleAPIError(error)
      return { statusCode: errResponse.canvasStatusCode, errors: [errResponse] }
    }

    const coursesInTerm = courses.filter(c => c.enrollment_term_id === termId)
    const apiPromises = coursesInTerm.map(async c => {
      const courseHandler = new CourseApiHandler(requestor, c.id)
      return await courseHandler.getSectionsWithCourse(CourseApiHandler.slimCourse(c))
    })
    const coursesWithSectionsResult = await Promise.all(apiPromises)
    return makeResponse<CourseWithSections>(coursesWithSectionsResult)
  }

  async getCourseSectionsInTermAsAdmin (
    user: User, termId: number, instructor: string | undefined, courseName: string | undefined
  ): Promise<CourseWithSections[] | APIErrorData> {
    const requestor = await this.canvasService.createRequestorForUser(user, '/api/v1/')
    const adminHandler = new AdminApiHandler(user, requestor)
    return await adminHandler.getCourseSectionsInTerm(termId, instructor, courseName)
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

  async createSections (user: User, courseId: number, sections: string[]): Promise<CanvasCourseSection[] | APIErrorData> {
    const requestor = await this.canvasService.createRequestorForUser(user, '/api/v1/')
    const courseHandler = new CourseApiHandler(requestor, courseId)
    return await courseHandler.createSections(sections)
  }

  async enrollSectionUsers (user: User, sectionId: number, sectionUsers: SectionUserDto[]): Promise<CanvasEnrollment[] | APIErrorData> {
    const requestor = await this.canvasService.createRequestorForUser(user, '/api/v1/')
    const enrollmentHandler = new EnrollSectionUsersApiHandler(requestor, sectionUsers, sectionId)
    return await enrollmentHandler.enrollUsers()
  }
}
