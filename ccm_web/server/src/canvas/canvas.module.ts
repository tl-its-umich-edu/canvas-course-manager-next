import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { CanvasService } from './canvas.service'

@Module({
  imports: [ConfigModule],
  providers: [CanvasService]
})
export class CanvasModule {}
