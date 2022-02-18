import { SessionData } from 'express-session'
import { HttpStatus, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { AdminApiHandler } from './api.admin.handler'
import { CourseApiHandler } from './api.course.handler'
import { APIErrorData, Globals, isAPIErrorData, ExternalEnrollmentUserData, ExternalEnrollmentResult } from './api.interfaces'
import { SectionApiHandler } from './api.section.handler'
import { handleAPIError, makeResponse } from './api.utils'
import { SectionEnrollmentDto } from './dtos/api.section.enrollment.dto'
import { SectionUserDto } from './dtos/api.section.users.dto'
import { SectionExternalUserDto } from './dtos/api.section.external.users.dto'
import {
  CanvasCourse,
  CanvasCourseBase,
  CanvasCourseSection,
  CanvasCourseSectionBase,
  CanvasEnrollment,
  CanvasUser,
  CanvasUserLoginEmail,
  CourseWithSections
} from '../canvas/canvas.interfaces'
import { CanvasService } from '../canvas/canvas.service'
import { isCirrusErrorData } from '../invitation/cirrus-invitation.interfaces'
import { CirrusInvitationService } from '../invitation/cirrus-invitation.service'
import { User } from '../user/user.model'

import { Config } from '../config'
import baseLogger from '../logger'

const logger = baseLogger.child({ filePath: __filename })

@Injectable()
export class APIService {
  constructor (
    private readonly canvasService: CanvasService,
    private readonly configService: ConfigService<Config, true>,
    private readonly invitationService: CirrusInvitationService
  ) {}

  getGlobals (user: User, sessionData: SessionData): Globals {
    return {
      environment: this.configService.get('server.isDev', { infer: true }) ? 'development' : 'production',
      canvasURL: this.configService.get('canvas.instanceURL', { infer: true }),
      user: {
        loginId: user.loginId,
        hasCanvasToken: user.canvasToken !== null
      },
      userLoginId: user.loginId,
      course: {
        id: sessionData.data.course.id,
        roles: sessionData.data.course.roles
      },
      baseHelpURL: this.configService.get('baseHelpURL', { infer: true })
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
      courses = await requestor.listItems<CanvasCourse>(endpoint, queryParams).toArray()
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
    const adminHandler = new AdminApiHandler(requestor, user.loginId)
    const accountsOrErrorData = await adminHandler.getParentAccounts()
    if (isAPIErrorData(accountsOrErrorData)) return accountsOrErrorData
    const accounts = accountsOrErrorData
    // Maybe we could do something more informative here if they aren't an account admin
    if (accounts.length === 0) return []
    return await adminHandler.getCourseSectionsInTerm(
      accounts.map(a => a.id), termId, instructor, courseName
    )
  }

  async getCourse (user: User, courseId: number): Promise<CanvasCourseBase | APIErrorData> {
    const requestor = await this.canvasService.createRequestorForUser(user, '/api/v1/')
    const courseHandler = new CourseApiHandler(requestor, courseId)
    return await courseHandler.getCourse()
  }

  async putCourseName (user: User, courseId: number, newName: string): Promise<CanvasCourseBase | APIErrorData> {
    const requestor = await this.canvasService.createRequestorForUser(user, '/api/v1/')
    const courseHandler = new CourseApiHandler(requestor, courseId)
    return await courseHandler.putCourse({ name: newName, course_code: newName })
  }

  async createSections (user: User, courseId: number, sections: string[]): Promise<CanvasCourseSection[] | APIErrorData> {
    const requestor = await this.canvasService.createRequestorForUser(user, '/api/v1/')
    const courseHandler = new CourseApiHandler(requestor, courseId)
    return await courseHandler.createSections(sections)
  }

  async getStudentsEnrolledInSection (user: User, sectionId: number): Promise<string[] | APIErrorData> {
    const requestor = await this.canvasService.createRequestorForUser(user, '/api/v1/')
    const sectionHandler = new SectionApiHandler(requestor, sectionId)
    return await sectionHandler.getStudentsEnrolled()
  }

  async enrollSectionUsers (user: User, sectionId: number, sectionUsers: SectionUserDto[]): Promise<CanvasEnrollment[] | APIErrorData> {
    const requestor = await this.canvasService.createRequestorForUser(user, '/api/v1/')
    const sectionHandler = new SectionApiHandler(requestor, sectionId)
    return await sectionHandler.enrollUsers(sectionUsers)
  }

  async enrollSectionExternalUsers (user: User, sectionId: number, sectionUsers: SectionExternalUserDto[]): Promise<ExternalEnrollmentResult> {
    // Get requestor/handler and account ID for admin operations
    const adminRequestor = this.canvasService.createRequestorForAdmin('/api/v1/')
    const adminHandler = new AdminApiHandler(adminRequestor, user.loginId)
    const newUserAccountID = this.configService.get('canvas.newUserAccountID', { infer: true })

    const resultData: ExternalEnrollmentUserData = {}

    // Create all requested users, noting failures
    const createErrors: APIErrorData[] = []
    const newUsers: CanvasUserLoginEmail[] = []
    const createUserResponses = await adminHandler.createExternalUsers(sectionUsers, newUserAccountID)
    createUserResponses.forEach(({ email, result }) => {
      let userCreated: false | APIErrorData | CanvasUserLoginEmail
      if (isAPIErrorData(result)) {
        if (result.statusCode === HttpStatus.BAD_REQUEST) {
          userCreated = false
        } else {
          userCreated = result
          createErrors.push(result)
        }
      } else {
        userCreated = result
        newUsers.push(result)
      }
      resultData[email] = { userCreated }
    })
    if (createErrors.length === sectionUsers.length) return { success: false, data: resultData }

    // Invite only new users
    if (newUsers.length > 0) {
      const newUsersEmails = newUsers.map(u => u.email)
      const inviteResult = await this.invitationService.sendInvitations(newUsersEmails)
      newUsersEmails.forEach(email => {
        resultData[email].inviteResult = inviteResult
      })
      // Bail if it failed
      if (isCirrusErrorData(inviteResult)) return { success: false, data: resultData }
    }

    // Enroll all users
    const enrollErrors: APIErrorData[] = []
    const enrollableSectionUsers = sectionUsers.filter(su => !isAPIErrorData(resultData[su.email].userCreated))
    const requestor = await this.canvasService.createRequestorForUser(user, '/api/v1/')

    const sectionHandler = new SectionApiHandler(requestor, sectionId)
    const enrollmentPromises = enrollableSectionUsers.map(async (su) => {
      const result = await sectionHandler.enrollUser(su)
      return { result, email: su.email }
    })
    const enrollmentResponses = await Promise.all(enrollmentPromises)
    enrollmentResponses.forEach(({ email, result }) => {
      if (isAPIErrorData(result)) enrollErrors.push(result)
      resultData[email].enrollment = result
    })
    return { success: !(createErrors.length > 0 || enrollErrors.length > 0), data: resultData }
  }

  async createSectionEnrollments (user: User, enrollments: SectionEnrollmentDto[]): Promise<CanvasEnrollment[] | APIErrorData> {
    const requestor = await this.canvasService.createRequestorForUser(user, '/api/v1/')
    const apiPromises = enrollments.map(async (e) => {
      const { sectionId, ...sectionUser } = e
      const sectionHandler = new SectionApiHandler(requestor, e.sectionId)
      return await sectionHandler.enrollUser(sectionUser)
    })
    const enrollmentResults = await Promise.all(apiPromises)
    return makeResponse<CanvasEnrollment>(enrollmentResults)
  }

  async getUserInfoAsAdmin (user: User, loginId: string): Promise<CanvasUser | APIErrorData> {
    const adminRequestor = this.canvasService.createRequestorForAdmin('/api/v1/')
    const adminHandler = new AdminApiHandler(adminRequestor, user.loginId)
    return await adminHandler.getUserInfo(loginId)
  }

  async mergeSections (user: User, targetCourseId: number, sectionIds: number[]): Promise<CanvasCourseSectionBase[] | APIErrorData> {
    const requestor = await this.canvasService.createRequestorForUser(user, '/api/v1/')
    const courseHandler = new CourseApiHandler(requestor, targetCourseId)
    return await courseHandler.mergeSections(sectionIds)
  }

  async unmergeSections (user: User, sectionIds: number[]): Promise<CanvasCourseSectionBase[] | APIErrorData> {
    const requestor = await this.canvasService.createRequestorForUser(user, '/api/v1/')
    const NS_PER_SEC = BigInt(1e9)
    const start = process.hrtime.bigint()
    const apiPromises = sectionIds.map(async (si) => {
      const sectionHandler = new SectionApiHandler(requestor, si)
      return await sectionHandler.unmergeSection()
    })
    const unmergeSectionResults = await Promise.all(apiPromises)
    const bulkResult = makeResponse<CanvasCourseSectionBase>(unmergeSectionResults)
    const end = process.hrtime.bigint()
    logger.debug(`Time elapsed: (${(end - start) / NS_PER_SEC}) seconds`)
    return bulkResult
  }
}
