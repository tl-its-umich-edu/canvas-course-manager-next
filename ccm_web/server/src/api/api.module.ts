import { Module } from '@nestjs/common'

import { APIController } from './api.controller'
import { APIService } from './api.service'
import { CanvasModule } from '../canvas/canvas.module'
import { CanvasService } from '../canvas/canvas.service'
import { UserModule } from '../user/user.module'

@Module({
  imports: [CanvasModule, UserModule],
  providers: [APIService, CanvasService],
  controllers: [APIController]
})
export class APIModule {}
