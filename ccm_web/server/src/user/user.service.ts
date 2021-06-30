import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { CanvasToken } from '../canvas/canvas.model'
import { UserToUpsert } from './user.interfaces'
import { User } from './user.model'

import { DatabaseError } from '../errors'
import baseLogger from '../logger'

const logger = baseLogger.child({ filePath: __filename })

@Injectable()
export class UserService {
  constructor (
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(CanvasToken)
    private readonly canvasTokenModel: typeof CanvasToken
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

  async findUserByLoginId (loginId: string): Promise<User | null> {
    try {
      const user = await this.userModel.findOne({
        where: { loginId },
        include: [{ model: this.canvasTokenModel }]
      })
      return user
    } catch (error) {
      logger.error(
        `An error occurred while fetching a User record from the database: ${JSON.stringify(error, null, 2)}`
      )
      throw new DatabaseError()
    }
  }
}
