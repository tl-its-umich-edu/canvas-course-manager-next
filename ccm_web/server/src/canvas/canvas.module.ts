import { HttpModule, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { SequelizeModule } from '@nestjs/sequelize'

import { CanvasController } from './canvas.controller'
import { CanvasToken } from './canvas.model'
import { CanvasService } from './canvas.service'

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
