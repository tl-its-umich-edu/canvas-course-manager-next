import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CanvasToken } from '../canvas/canvas.model'
import { UserService } from './user.service'
import { User } from './user.model'

@Module({
  imports: [SequelizeModule.forFeature([CanvasToken, User])],
  providers: [UserService],
  exports: [SequelizeModule, UserService]
})
export class UserModule {}
