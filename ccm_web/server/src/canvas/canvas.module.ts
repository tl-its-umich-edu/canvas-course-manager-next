import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { SequelizeModule } from '@nestjs/sequelize'

import { CanvasController } from './canvas.controller.js'
import { CanvasToken } from './canvas.model.js'
import { CanvasService } from './canvas.service.js'

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    SequelizeModule.forFeature([CanvasToken])
  ],
  controllers: [CanvasController],
  providers: [CanvasService],
  exports: [CanvasService, HttpModule, SequelizeModule]
})
export class CanvasModule {}
