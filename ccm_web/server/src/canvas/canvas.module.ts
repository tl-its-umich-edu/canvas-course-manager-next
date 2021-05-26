import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { CanvasService } from './canvas.service'
import { CanvasController } from './canvas.controller'

@Module({
  imports: [ConfigModule],
  controllers: [CanvasController],
  providers: [CanvasService],
  exports: [CanvasService]
})
export class CanvasModule {}
