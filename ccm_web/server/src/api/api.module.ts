import { Module } from '@nestjs/common'

import { APIController } from './api.controller'
import { APIService } from './api.service'

@Module({
  providers: [APIService],
  controllers: [APIController]
})
export class APIModule {}
