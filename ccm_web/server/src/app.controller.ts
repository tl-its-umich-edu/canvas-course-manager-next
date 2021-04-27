import { Controller, Get } from '@nestjs/common'
import { HelloData, Globals } from './app.interfaces'
import { AppService } from './app.service'

@Controller('api')
export class AppController {
  constructor (private readonly appService: AppService) {}

  @Get('hello')
  getHello (): HelloData {
    return this.appService.getHello()
  }

  @Get('globals')
  getGlobals (): Globals {
    return this.appService.getGlobals()
  }
}
