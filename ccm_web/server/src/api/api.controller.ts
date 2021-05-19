import { Controller, Get } from '@nestjs/common'

import { HelloData, Globals } from './api.interfaces'
import { APIService } from './api.service'

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
