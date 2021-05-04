import { Controller, Get } from '@nestjs/common'

import { HelloData, Globals } from './base.interfaces'
import { BaseService } from './base.service'

@Controller('api')
export class BaseController {
  constructor (private readonly baseService: BaseService) {}

  @Get('hello')
  getHello (): HelloData {
    return this.baseService.getHello()
  }

  @Get('globals')
  getGlobals (): Globals {
    return this.baseService.getGlobals()
  }
}
