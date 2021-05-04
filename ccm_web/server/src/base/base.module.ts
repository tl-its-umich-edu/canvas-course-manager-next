import { Module } from '@nestjs/common'

import { BaseController } from './base.controller'
import { BaseService } from './base.service'

@Module({
  providers: [BaseService],
  controllers: [BaseController]
})
export class BaseModule {}
