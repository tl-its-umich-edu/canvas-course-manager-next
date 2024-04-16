import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CanvasToken } from '../canvas/canvas.model.js'
import { UserService } from './user.service.js'
import { User } from './user.model.js'

@Module({
  imports: [SequelizeModule.forFeature([CanvasToken, User])],
  providers: [UserService],
  exports: [SequelizeModule, UserService]
})
export class UserModule {}
