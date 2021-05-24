import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { UserToUpsert } from './user.interfaces'
import { User } from './user.model'

@Injectable()
export class UserService {
  constructor (
    @InjectModel(User)
    private readonly userModel: typeof User
  ) {}

  /* 
  The User object for MySQL dialect always returns boolean value for `created` variable,
  but not with other DB dialects. To avoid TypeScript errors including boolean | null
  https://sequelize.org/master/class/lib/model.js~Model.html#static-method-upsert
  */
  async upsertUser (userToUpsert: UserToUpsert): Promise<[User, boolean | null]> {
    const [record, created] = await this.userModel.upsert({
      ...userToUpsert
    })
    return [record, created]
  }
}
