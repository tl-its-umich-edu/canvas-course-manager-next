import { SessionData } from 'express-session'
import {
  Body, Controller, Get, HttpException, Param, ParseIntPipe, Post, Put, Session, UseGuards, UseInterceptors
} from '@nestjs/common'
import { ApiSecurity } from '@nestjs/swagger'

import { Globals, isAPIErrorData } from './api.interfaces'
import { APIService } from './api.service'
import { CourseNameDto } from './dtos/api.course.name.dto'
import { CreateSectionsDto } from './dtos/api.create.sections.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CanvasCourseBase, CanvasCourseSection } from '../canvas/canvas.interfaces'
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
  @Get('course/:id/name')
  async getCourseName (
    @Param('id', ParseIntPipe) courseId: number, @UserDec() user: User
  ): Promise<CanvasCourseBase> {
    const result = await this.apiService.getCourseName(user, courseId)
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
}
