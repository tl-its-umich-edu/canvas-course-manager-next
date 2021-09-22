import { SessionData } from 'express-session'
import {
  Body, Controller, Delete, Get, HttpException, Param, ParseIntPipe, Post, Put, Query, Session, UseGuards, UseInterceptors
} from '@nestjs/common'
import { ApiQuery, ApiSecurity } from '@nestjs/swagger'

import { Globals, isAPIErrorData } from './api.interfaces'
import { APIService } from './api.service'
import { CourseNameDto } from './dtos/api.course.name.dto'
import { CreateSectionsDto } from './dtos/api.create.sections.dto'
import { SectionUserDto, SectionUsersDto } from './dtos/api.section.users.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import {
  CanvasCourseBase, CanvasCourseSection, CanvasCourseSectionBase, CanvasEnrollment, CourseWithSections
} from '../canvas/canvas.interfaces'
import { InvalidTokenInterceptor } from '../canvas/invalid.token.interceptor'
import { UserDec } from '../user/user.decorator'
import { User } from '../user/user.model'

@UseGuards(JwtAuthGuard)
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
  @ApiQuery({ name: 'instructor', required: false, type: String })
  @ApiQuery({ name: 'course_name', required: false, type: String })
  @Get('admin/sections')
  async getCourseSectionsInTermAsAdmin (
    @UserDec() user: User,
      @Query('term_id', ParseIntPipe) termId: number,
      @Query('instructor') instructor?: string,
      @Query('course_name') courseName?: string
  ): Promise<CourseWithSections[]> {
    const result = await this.apiService.getCourseSectionsInTermAsAdmin(user, termId, instructor, courseName)
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
  @Post('sections/:id/merge/:course')
  async mergeSection (
    @Param('id', ParseIntPipe) sectionId: number,
      @Param('course', ParseIntPipe) courseId: number,
      @UserDec() user: User
  ): Promise<CanvasCourseSectionBase> {
    const result = await this.apiService.mergeSection(user, sectionId, courseId)
    if (isAPIErrorData(result)) throw new HttpException(result, result.statusCode)
    return result
  }

  @UseInterceptors(InvalidTokenInterceptor)
  @ApiSecurity('CSRF-Token')
  @Delete('sections/:id/unmerge')
  async unmergeSection (@Param('id', ParseIntPipe) sectionId: number, @UserDec() user: User): Promise<CanvasCourseSectionBase> {
    const result = await this.apiService.unmergeSection(user, sectionId)
    if (isAPIErrorData(result)) throw new HttpException(result, result.statusCode)
    return result
  }
}
