import { Controller, Get } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

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
  getGlobals (): Globals {
    return this.apiService.getGlobals()
  }
}
