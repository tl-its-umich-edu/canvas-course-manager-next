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

import { TooManyResultsError } from './api.errors'
import { Globals, isAPIErrorData, ExternalUserData } from './api.interfaces'
import { APIService } from './api.service'
import { InvalidTokenInterceptor } from './invalid.token.interceptor'
import { CourseNameDto } from './dtos/api.course.name.dto'
import { CreateSectionsDto } from './dtos/api.create.sections.dto'
import { GetSectionsAdminQueryDto } from './dtos/api.get.sections.admin.dto'
import { GetSectionsInstructorQueryDto } from './dtos/api.get.sections.instructor.dto'
import { SectionEnrollmentsDto } from './dtos/api.section.enrollment.dto'
import { SectionIdsDto } from './dtos/api.section.ids.dto'
import { SectionUserDto, SectionUsersDto } from './dtos/api.section.users.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { SessionGuard } from '../auth/session.guard'
import {
  CanvasCourseBase,
  CanvasCourseSection,
  CanvasCourseSectionBase,
  CanvasEnrollment,
  CourseWithSections
} from '../canvas/canvas.interfaces'
import { UserDec } from '../user/user.decorator'
import { User } from '../user/user.model'
import {
  ExternalUserDto, ExternalUsersDto
} from './dtos/api.external.users.dto'

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

  // Uses admin token, so InvalidTokenInterceptor omitted
  @ApiSecurity('CSRF-Token')
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
  @ApiSecurity('CSRF-Token')
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
  async checkIfUserExistsAsAdmin (
    @Param('loginId') loginId: string
  ): Promise<void> {
    const result = await this.apiService.checkIfUserExistsAsAdmin(loginId)
    if (result !== undefined) throw new HttpException(result, result.statusCode)
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
    let result
    try {
      result = await this.apiService.getCourseSectionsInTermAsAdmin(
        user, query.term_id, query.instructor_name, query.course_name
      )
    } catch (error: unknown) {
      if (error instanceof TooManyResultsError) {
        throw new BadRequestException('Too many courses matched your search term; please refine your search.')
      } else {
        throw error
      }
    }
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
