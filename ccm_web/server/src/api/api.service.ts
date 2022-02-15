import { SessionData } from 'express-session'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { AdminApiHandler } from './api.admin.handler'
import { CourseApiHandler } from './api.course.handler'
import { APIErrorData, Globals, isAPIErrorData } from './api.interfaces'
import { SectionApiHandler } from './api.section.handler'
import { handleAPIError, makeResponse,  } from './api.utils'
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
  CourseWithSections,
  ExternalEnrollments
} from '../canvas/canvas.interfaces'
import { CanvasService } from '../canvas/canvas.service'
import {
  CirrusInvitationService
} from '../invitation/cirrus-invitation.service'
import { User } from '../user/user.model'

import { Config } from '../config'
import baseLogger from '../logger'
import {
  CirrusInvitationResponse
} from '../invitation/cirrus-invitation.interfaces'
import { hasKeys } from '../typeUtils'

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

  async enrollSectionExternalUsers (user: User, session: SessionData, sectionId: number, sectionUsers: SectionExternalUserDto[]): Promise<ExternalEnrollments|APIErrorData> {
    // Get requestor/handler and account ID for admin operations
    const adminRequestor = this.canvasService.createRequestorForAdmin('/api/v1/')
    const adminHandler = new AdminApiHandler(adminRequestor, user.loginId)
    const newUserAccountID =  this.configService.get('canvas.newUserAccountID', { infer: true }) as number

    // Create all requested users, noting failures
    const createUserResponses = await adminHandler.createExternalUsers(sectionUsers, newUserAccountID)
    const newUsers = createUserResponses.filter(response => !hasKeys(response, ['error'])) as CanvasUserLoginEmail[]

    console.log('createUserResponses…')
    console.log(JSON.stringify(createUserResponses))

    // Create a new map of user email to CanvasUserLoginEmail objects
    let newResults = new Map(createUserResponses.map(x => [x.email, x]))
    console.log('newResults…')
    console.log(newResults) // do not use JSON.stringify() here

    // Results of inviting only new users
    let inviteResults: CirrusInvitationResponse
    try {
      inviteResults = await this.invitationService.sendInvitations(newUsers)
    } catch (e: any) {
      inviteResults = { errors: [String(e.message)] }
    }

    // Enroll all users
    const requestor = await this.canvasService.createRequestorForUser(user, '/api/v1/')
    const sectionHandler = new SectionApiHandler(requestor, sectionId)
    const userEnrollments = await sectionHandler.enrollUsers(sectionUsers)

    return {
      usersCreated: createUserResponses,
      inviteResults: inviteResults,
      userEnrollments: userEnrollments
    }
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
