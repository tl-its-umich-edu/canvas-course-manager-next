import { SessionData } from 'express-session'
import {
  BadRequestException, Body, Controller, Delete, Get, HttpException, Param, ParseIntPipe,
  Post, Put, Query, Session, UseGuards, UseInterceptors
} from '@nestjs/common'
import { ApiQuery, ApiSecurity } from '@nestjs/swagger'

import { Globals, isAPIErrorData } from './api.interfaces'
import { APIService } from './api.service'
import { InvalidTokenInterceptor } from './invalid.token.interceptor'
import { CourseNameDto } from './dtos/api.course.name.dto'
import { CreateSectionsDto } from './dtos/api.create.sections.dto'
import { GetSectionsAdminQueryDto } from './dtos/api.get.sections.admin.dto'
import { SectionEnrollmentsDto } from './dtos/api.section.enrollment.dto'
import { SectionIdsDto } from './dtos/api.section.ids.dto'
import { SectionUserDto, SectionUsersDto } from './dtos/api.section.users.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { SessionGuard } from '../auth/session.guard'
import {
  CanvasCourseBase, CanvasCourseSection, CanvasCourseSectionBase, CanvasEnrollment, CourseWithSections
} from '../canvas/canvas.interfaces'
import { UserDec } from '../user/user.decorator'
import { User } from '../user/user.model'

@UseGuards(JwtAuthGuard, SessionGuard)
@Controller('api')
export class APIController {
  constructor (private readonly apiService: APIService) {}

  @Get('globals')
  getGlobals (@Session() session: SessionData, @UserDec() user: User): Globals {
    return this.apiService.getGlobals(user, session)
  }

  @UseInterceptors(InvalidTokenInterceptor)
  @Get('course/:id/sections')
  async getCourseSections (
    @Param('id', ParseIntPipe) courseId: number, @UserDec() user: User
  ): Promise<CanvasCourseSection[]> {
    const result = await this.apiService.getCourseSections(user, courseId)
    if (isAPIErrorData(result)) throw new HttpException(result, result.statusCode)
    return result
  }

  @UseInterceptors(InvalidTokenInterceptor)
  @Get('course/:id')
  async getCourse (
    @Param('id', ParseIntPipe) courseId: number, @UserDec() user: User
  ): Promise<CanvasCourseBase> {
    const result = await this.apiService.getCourse(user, courseId)
    if (isAPIErrorData(result)) throw new HttpException(result, result.statusCode)
    return result
  }

  @UseInterceptors(InvalidTokenInterceptor)
  @ApiSecurity('CSRF-Token')
  @Put('course/:id/name')
  async putCourseName (
    @Param('id', ParseIntPipe) courseId: number, @Body() courseNameDto: CourseNameDto, @UserDec() user: User
  ): Promise<CanvasCourseBase> {
    const result = await this.apiService.putCourseName(user, courseId, courseNameDto.newName)
    if (isAPIErrorData(result)) throw new HttpException(result, result.statusCode)
    return result
  }

  @UseInterceptors(InvalidTokenInterceptor)
  @ApiSecurity('CSRF-Token')
  @Post('course/:id/sections')
  async createSections (@Param('id', ParseIntPipe) courseId: number, @Body() createSectionsDto: CreateSectionsDto, @UserDec() user: User): Promise<CanvasCourseSection[]> {
    const sections = createSectionsDto.sections
    const result = await this.apiService.createSections(user, courseId, sections)
    if (isAPIErrorData(result)) throw new HttpException(result, result.statusCode)
    return result
  }

  @UseInterceptors(InvalidTokenInterceptor)
  @Get('sections/:id/students')
  async getStudentsEnrolledInSection (@Param('id', ParseIntPipe) sectionId: number, @UserDec() user: User): Promise<string[]> {
    const result = await this.apiService.getStudentsEnrolledInSection(user, sectionId)
    if (isAPIErrorData(result)) throw new HttpException(result, result.statusCode)
    return result
  }

  @UseInterceptors(InvalidTokenInterceptor)
  @ApiSecurity('CSRF-Token')
  @Post('sections/:id/enroll')
  async enrollSectionUsers (@Param('id', ParseIntPipe) sectionId: number, @Body() sectionUsersData: SectionUsersDto, @UserDec() user: User): Promise<CanvasEnrollment[]> {
    const users: SectionUserDto[] = sectionUsersData.users
    const result = await this.apiService.enrollSectionUsers(user, sectionId, users)
    if (isAPIErrorData(result)) throw new HttpException(result, result.statusCode)
    return result
  }

  @UseInterceptors(InvalidTokenInterceptor)
  @ApiSecurity('CSRF-Token')
  @Post('course/:id/sections/enroll')
  async enrollUsersToSections (
    @Param('id', ParseIntPipe) courseId: number, @Body() enrollmentsDto: SectionEnrollmentsDto, @UserDec() user: User
  ): Promise<CanvasEnrollment[]> {
    const enrollments = enrollmentsDto.enrollments
    const getSectionsResult = await this.apiService.getCourseSections(user, courseId)
    if (isAPIErrorData(getSectionsResult)) throw new HttpException(getSectionsResult, getSectionsResult.statusCode)
    const validSectionIds = getSectionsResult.map(s => s.id)
    const invalidSectionIds: number[] = []
    enrollments.forEach(e => {
      if (!validSectionIds.includes(e.sectionId) && !invalidSectionIds.includes(e.sectionId)) {
        invalidSectionIds.push(e.sectionId)
      }
    })
    if (invalidSectionIds.length > 0) {
      const message = `Course with ID ${courseId} does not have sections with the following ID(s): ${invalidSectionIds.join(', ')}`
      throw new BadRequestException(message)
    }
    const enrollmentsResult = await this.apiService.createSectionEnrollments(user, courseId, enrollments)
    if (isAPIErrorData(enrollmentsResult)) throw new HttpException(enrollmentsResult, enrollmentsResult.statusCode)
    return enrollmentsResult
  }

  @UseInterceptors(InvalidTokenInterceptor)
  @Get('instructor/sections')
  async getCourseSectionsInTermAsInstructor (
    @UserDec() user: User, @Query('term_id', ParseIntPipe) termId: number
  ): Promise<CourseWithSections[]> {
    const result = await this.apiService.getCourseSectionsInTermAsInstructor(user, termId)
    if (isAPIErrorData(result)) throw new HttpException(result, result.statusCode)
    return result
  }

  @UseInterceptors(InvalidTokenInterceptor)
  @ApiQuery({ name: 'term_id', type: Number })
  @ApiQuery({ name: 'instructor_name', required: false, type: String })
  @ApiQuery({ name: 'course_name', required: false, type: String })
  @Get('admin/sections')
  async getCourseSectionsInTermAsAdmin (
    @Query() query: GetSectionsAdminQueryDto,
      @UserDec() user: User
  ): Promise<CourseWithSections[]> {
    if (query.instructor_name === undefined && query.course_name === undefined) {
      throw new BadRequestException('You must specify either instructor or course_name as a URL parameter.')
    }
    const result = await this.apiService.getCourseSectionsInTermAsAdmin(
      user, query.term_id, query.instructor_name, query.course_name
    )
    if (isAPIErrorData(result)) throw new HttpException(result, result.statusCode)
    return result
  }

  @UseInterceptors(InvalidTokenInterceptor)
  @ApiSecurity('CSRF-Token')
  @Post('course/:id/sections/merge')
  async mergeSections (
    @Param('id', ParseIntPipe) targetCourseId: number,
      @Body() sectionIdsData: SectionIdsDto,
      @UserDec() user: User
  ): Promise<CanvasCourseSectionBase[]> {
    const { sectionIds } = sectionIdsData
    const result = await this.apiService.mergeSections(user, targetCourseId, sectionIds)
    if (isAPIErrorData(result)) throw new HttpException(result, result.statusCode)
    return result
  }

  @UseInterceptors(InvalidTokenInterceptor)
  @ApiSecurity('CSRF-Token')
  @Delete('sections/unmerge')
  async unmergeSections (@Body() sectionIdsData: SectionIdsDto, @UserDec() user: User): Promise<CanvasCourseSectionBase[]> {
    const { sectionIds } = sectionIdsData
    const result = await this.apiService.unmergeSections(user, sectionIds)
    if (isAPIErrorData(result)) throw new HttpException(result, result.statusCode)
    return result
  }
}
