import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { SequelizeModule } from '@nestjs/sequelize'

import { CanvasService } from './canvas.service'
import { CanvasController } from './canvas.controller'
import { Session } from '../session/session.model'

@Module({
  imports: [ConfigModule, SequelizeModule.forFeature([Session])],
  controllers: [CanvasController],
  providers: [CanvasService],
  exports: [CanvasService]
})
export class CanvasModule {}
