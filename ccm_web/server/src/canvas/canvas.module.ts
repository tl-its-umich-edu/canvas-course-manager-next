import { HttpModule, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { SequelizeModule } from '@nestjs/sequelize'

import { CanvasController } from './canvas.controller'
import { CanvasToken } from './canvas.model'
import { CanvasService } from './canvas.service'
import { UserModule } from '../user/user.module'
import { UserService } from '../user/user.service'

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    SequelizeModule.forFeature([CanvasToken]),
    UserModule
  ],
  controllers: [CanvasController],
  providers: [CanvasService, UserService],
  exports: [CanvasService, HttpModule, SequelizeModule, UserService]
})
export class CanvasModule {}
