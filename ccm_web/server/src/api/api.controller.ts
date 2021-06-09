import { SessionData } from 'express-session'
import { Body, Controller, Get, InternalServerErrorException, Post, Session } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { HelloData, Globals } from './api.interfaces'
import { APIService } from './api.service'
import { CourseNameDto } from './dtos/api.course.name.dto'

@ApiBearerAuth()
@Controller('api')
export class APIController {
  constructor (private readonly apiService: APIService) {}

  @Get('hello')
  getHello (): HelloData {
    return this.apiService.getHello()
  }

  @Get('globals')
  getGlobals (@Session() session: SessionData): Globals {
    return this.apiService.getGlobals(session)
  }

  @Get('courseName')
  async getCourseName (@Session() session: SessionData): Promise<string> {
    const { userLoginId, course } = session.data
    const result = await this.apiService.getCourseName(userLoginId, course.id)
    if (result === null) throw new InternalServerErrorException('Error occurred while communicating with Canvas')
    return result
  }

  @Post('courseName')
  async postCourseName (
    @Body() courseNameDto: CourseNameDto, @Session() session: SessionData
  ): Promise<string> {
    const { userLoginId, course } = session.data
    const result = await this.apiService.postCourseName(userLoginId, course.id, courseNameDto.newName)
    if (result === null) throw new InternalServerErrorException('Error occurred while communicating with Canvas')
    return result
  }
}
