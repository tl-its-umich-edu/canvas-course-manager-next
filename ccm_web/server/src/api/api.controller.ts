import { SessionData } from 'express-session'
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Session,
  UseGuards,
  UseInterceptors
} from '@nestjs/common'
import { ApiQuery, ApiSecurity } from '@nestjs/swagger'

import { Globals, isAPIErrorData, ExternalUserData } from './api.interfaces.js'
import { APIService } from './api.service.js'
import { InvalidTokenInterceptor } from './invalid.token.interceptor.js'
import { TooManyResultsInterceptor } from './too.many.results.interceptor.js'
import { CourseNameDto } from './dtos/api.course.name.dto.js'
import { CreateSectionsDto } from './dtos/api.create.sections.dto.js'
import { GetSectionsAdminQueryDto } from './dtos/api.get.sections.admin.dto.js'
import { GetSectionsInstructorQueryDto } from './dtos/api.get.sections.instructor.dto.js'
import { SectionEnrollmentsDto } from './dtos/api.section.enrollment.dto.js'
import { SectionIdsDto } from './dtos/api.section.ids.dto.js'
import { SectionUserDto, SectionUsersDto } from './dtos/api.section.users.dto.js'
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js'
import { SessionGuard } from '../auth/session.guard.js'
import {
  CanvasCourseBase,
  CanvasCourseSection,
  CanvasCourseSectionBase,
  CanvasEnrollment,
  CanvasUserCondensed,
  CourseWithSections
} from '../canvas/canvas.interfaces.js'
import { UserDec } from '../user/user.decorator.js'
import { User } from '../user/user.model.js'
import {
  ExternalUserDto, ExternalUsersDto
} from './dtos/api.external.users.dto.js'

@UseGuards(JwtAuthGuard, SessionGuard)
@Controller('api')
export class APIController {
  constructor (private readonly apiService: APIService) { }

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
  @ApiSecurity('x-csrf-token')
  @Put('course/:id/name')
  async putCourseName (
    @Param('id', ParseIntPipe) courseId: number, @Body() courseNameDto: CourseNameDto, @UserDec() user: User
  ): Promise<CanvasCourseBase> {
    const result = await this.apiService.putCourseName(user, courseId, courseNameDto.newName)
    if (isAPIErrorData(result)) throw new HttpException(result, result.statusCode)
    return result
  }

  @UseInterceptors(InvalidTokenInterceptor)
  @ApiSecurity('x-csrf-token')
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
  @ApiSecurity('x-csrf-token')
  @Post('sections/:id/enroll')
  async enrollSectionUsers (@Param('id', ParseIntPipe) sectionId: number, @Body() sectionUsersData: SectionUsersDto, @UserDec() user: User): Promise<CanvasEnrollment[]> {
    const users: SectionUserDto[] = sectionUsersData.users
    const result = await this.apiService.enrollSectionUsers(user, sectionId, users)
    if (isAPIErrorData(result)) throw new HttpException(result, result.statusCode)
    return result
  }

  // Uses admin token, so InvalidTokenInterceptor omitted
  @ApiSecurity('x-csrf-token')
  @Post('admin/createExternalUsers')
  async createExternalUsers (
    @Body() externalUsersData: ExternalUsersDto
  ): Promise<ExternalUserData[]> {
    const externalUsers: ExternalUserDto[] = externalUsersData.users
    const result = await this.apiService.createExternalUsers(externalUsers)
    if (!result.success) {
      throw new HttpException({ statusCode: result.statusCode, data: result.data }, result.statusCode)
    }
    return result.data
  }

  @UseInterceptors(InvalidTokenInterceptor)
  @ApiSecurity('x-csrf-token')
  @Post('/sections/enroll')
  async enrollUsersToSections (
    @Body() enrollmentsDto: SectionEnrollmentsDto, @UserDec() user: User
  ): Promise<CanvasEnrollment[]> {
    const enrollments = enrollmentsDto.enrollments
    const enrollmentsResult = await this.apiService.createSectionEnrollments(user, enrollments)
    if (isAPIErrorData(enrollmentsResult)) throw new HttpException(enrollmentsResult, enrollmentsResult.statusCode)
    return enrollmentsResult
  }

  // Uses admin token, so InvalidTokenInterceptor omitted
  @Get('admin/user/:loginId')
  async getUserInfoAsAdmin (
    @Param('loginId') loginId: string
  ): Promise<CanvasUserCondensed> {
    const result = await this.apiService.getUserInfoAsAdmin(loginId)
    if (isAPIErrorData(result)) throw new HttpException(result, result.statusCode)
    return result
  }

  @UseInterceptors(InvalidTokenInterceptor)
  @ApiQuery({ name: 'term_id', type: Number })
  @Get('instructor/sections')
  async getCourseSectionsInTermAsInstructor (
    @UserDec() user: User, @Query() query: GetSectionsInstructorQueryDto
  ): Promise<CourseWithSections[]> {
    const result = await this.apiService.getCourseSectionsInTermAsInstructor(user, query.term_id)
    if (isAPIErrorData(result)) throw new HttpException(result, result.statusCode)
    return result
  }

  @UseInterceptors(InvalidTokenInterceptor, new TooManyResultsInterceptor('courses'))
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
  @ApiSecurity('x-csrf-token')
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
  @ApiSecurity('x-csrf-token')
  @Delete('sections/unmerge')
  async unmergeSections (@Body() sectionIdsData: SectionIdsDto, @UserDec() user: User): Promise<CanvasCourseSectionBase[]> {
    const { sectionIds } = sectionIdsData
    const result = await this.apiService.unmergeSections(user, sectionIds)
    if (isAPIErrorData(result)) throw new HttpException(result, result.statusCode)
    return result
  }
}
