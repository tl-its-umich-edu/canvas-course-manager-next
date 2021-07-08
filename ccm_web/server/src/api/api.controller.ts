import { SessionData } from 'express-session'
import {
  Body, Controller, Get, HttpException, Param, ParseIntPipe, Post, Put, Session, UseGuards
} from '@nestjs/common'

import { Globals, isAPIErrorData } from './api.interfaces'
import { APIService } from './api.service'
import { CourseNameDto } from './dtos/api.course.name.dto'
import { CreateSectionsDto } from './dtos/api.create.sections.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CanvasCourseBase, CanvasCourseSection } from '../canvas/canvas.interfaces'

@Controller('api')
export class APIController {
  constructor (private readonly apiService: APIService) {}

  @UseGuards(JwtAuthGuard)
  @Get('globals')
  getGlobals (@Session() session: SessionData): Globals {
    return this.apiService.getGlobals(session)
  }

  @UseGuards(JwtAuthGuard)
  @Get('course/:id/sections')
  async getCourseSections (
    @Param('id', ParseIntPipe) courseId: number, @Session() session: SessionData
  ): Promise<CanvasCourseSection[]> {
    const { userLoginId } = session.data
    const result = await this.apiService.getCourseSections(userLoginId, courseId)
    if (isAPIErrorData(result)) throw new HttpException(result, result.statusCode)
    return result
  }

  @UseGuards(JwtAuthGuard)
  @Get('course/:id/name')
  async getCourseName (
    @Param('id', ParseIntPipe) courseId: number, @Session() session: SessionData
  ): Promise<CanvasCourseBase> {
    const { userLoginId } = session.data
    const result = await this.apiService.getCourseName(userLoginId, courseId)
    if (isAPIErrorData(result)) throw new HttpException(result, result.statusCode)
    return result
  }

  @UseGuards(JwtAuthGuard)
  @Put('course/:id/name')
  async putCourseName (
    @Param('id', ParseIntPipe) courseId: number, @Body() courseNameDto: CourseNameDto, @Session() session: SessionData
  ): Promise<CanvasCourseBase> {
    const { userLoginId } = session.data
    const result = await this.apiService.putCourseName(userLoginId, courseId, courseNameDto.newName)
    if (isAPIErrorData(result)) throw new HttpException(result, result.statusCode)
    return result
  }

  @Post('course/:id/sections')
  async createSections (@Param('id', ParseIntPipe) courseId: number, @Body() createSectionsDto: CreateSectionsDto, @Session() session: SessionData): Promise<CanvasCourseSection[]> {
    const { userLoginId } = session.data
    const sections = createSectionsDto.sections
    const result = await this.apiService.createSections(userLoginId, courseId, sections)
    if (isAPIErrorData(result)) throw new HttpException(result, result.statusCode)
    return result
  }
}
