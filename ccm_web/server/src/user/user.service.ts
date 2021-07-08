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
  The created variable will return a non-null value for MySQL, but the return type on
  the upsert method is Promise<[User, boolean | null]>, so Typescript is requiring a null check.
  So here the null is changed to false to escape the type validation errors.
  */
  async upsertUser (userToUpsert: UserToUpsert): Promise<User> {
    try {
      const [record, created] = await this.userModel.upsert({ ...userToUpsert })
      logger.info(
        `User ${record.loginId} was ${(created ?? false) ? 'created' : 'updated'} in 'user' table`
      )
      return record
    } catch (error) {
      logger.error(
        `An error occurred while creating or updating a User record in the database: ${JSON.stringify(error, null, 2)}`
      )
      throw new DatabaseError()
    }
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
