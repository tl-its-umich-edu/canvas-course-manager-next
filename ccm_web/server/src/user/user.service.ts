import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { CreateUserDto } from './dto/create-user.dto'
import { User } from './user.model'
@Injectable()
export class UserService {
  constructor (
    @InjectModel(User)
    private readonly userModel: typeof User
  ) {}

  /* the User object for Mysql dialects always returns boolean value for `created` variable,
  but not with other DB dialects. To avoid typescript errors including boolean | null
  https://sequelize.org/master/class/lib/model.js~Model.html#static-method-upsert
  */
  async upsertUser (createUserDto: CreateUserDto): Promise<[User, boolean | null]> {
    const [record, created] = await User.upsert({
      ...createUserDto
    })
    return [record, created]
  }
}
