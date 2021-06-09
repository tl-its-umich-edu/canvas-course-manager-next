import { Module } from '@nestjs/common'

import { APIController } from './api.controller'
import { APIService } from './api.service'
import { CanvasModule } from '../canvas/canvas.module'
import { CanvasService } from '../canvas/canvas.service'

@Module({
  imports: [CanvasModule],
  providers: [APIService, CanvasService],
  controllers: [APIController]
})
export class APIModule {}
