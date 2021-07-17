import { SessionData } from 'express-session'
import {
  Body, Controller, Get, HttpException, Param, ParseIntPipe, Put, Session
} from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { Globals, isAPIErrorData } from './api.interfaces'
import { APIService } from './api.service'
import { CourseNameDto } from './dtos/api.course.name.dto'
import { CanvasCourseBase, CanvasCourseSection } from '../canvas/canvas.interfaces'

@ApiBearerAuth()
@Controller('api')
export class APIController {
  constructor (private readonly apiService: APIService) {}

  @Get('globals')
  getGlobals (@Session() session: SessionData): Globals {
    return this.apiService.getGlobals(session)
  }

  @Get('course/:id/sections')
  async getCourseSections (
    @Param('id', ParseIntPipe) courseId: number, @Session() session: SessionData
  ): Promise<CanvasCourseSection[]> {
    const { userLoginId } = session.data
    const result = await this.apiService.getCourseSections(userLoginId, courseId)
    if (isAPIErrorData(result)) throw new HttpException(result, result.statusCode)
    return result
  }

  @Get('course/:id/name')
  async getCourseName (
    @Param('id', ParseIntPipe) courseId: number, @Session() session: SessionData
  ): Promise<CanvasCourseBase> {
    const { userLoginId } = session.data
    const result = await this.apiService.getCourseName(userLoginId, courseId)
    if (isAPIErrorData(result)) throw new HttpException(result, result.statusCode)
    return result
  }

  @Put('course/:id/name')
  async putCourseName (
    @Param('id', ParseIntPipe) courseId: number, @Body() courseNameDto: CourseNameDto, @Session() session: SessionData
  ): Promise<CanvasCourseBase> {
    const { userLoginId } = session.data
    const result = await this.apiService.putCourseName(userLoginId, courseId, courseNameDto.newName)
    if (isAPIErrorData(result)) throw new HttpException(result, result.statusCode)
    return result
  }
}
