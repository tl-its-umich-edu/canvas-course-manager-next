import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { UserService } from './user.service'
import { User } from './user.model'

@Module({
  imports: [SequelizeModule.forFeature([User])],
  providers: [UserService],
  exports: [SequelizeModule, UserService]
})
export class UserModule {}
