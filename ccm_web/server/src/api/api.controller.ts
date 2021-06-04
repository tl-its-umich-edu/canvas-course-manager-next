import { Request } from 'express'
import { SessionData } from 'express-session'
import { Controller, Get, Req, Session } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { HelloData, Globals } from './api.interfaces'
import { APIService } from './api.service'

@ApiBearerAuth()
@Controller('api')
export class APIController {
  constructor (private readonly apiService: APIService) {}

  @Get('hello')
  getHello (@Req() req: Request, @Session() session: SessionData): HelloData {
    console.log(req.sessionID)
    console.log(req.session)
    return this.apiService.getHello()
  }

  @Get('globals')
  getGlobals (): Globals {
    return this.apiService.getGlobals()
  }
}
