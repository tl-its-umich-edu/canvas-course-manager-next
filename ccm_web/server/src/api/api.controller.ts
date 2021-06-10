import { Controller, Get, Req, Session } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import { Request } from 'express'
import { SessionData } from 'express-session'

import { HelloData, Globals } from './api.interfaces'
import { APIService } from './api.service'

@ApiBearerAuth()
@Controller('api')
export class APIController {
  constructor (private readonly apiService: APIService) {}

  @Get('hello')
  getHello (): HelloData {
    return this.apiService.getHello()
  }

  @Get('globals')
  getGlobals (@Req() req: Request, @Session() session: SessionData): Globals {
    return this.apiService.getGlobals(session)
  }
}
