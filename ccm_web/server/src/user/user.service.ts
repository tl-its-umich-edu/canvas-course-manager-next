import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { CanvasToken } from '../canvas/canvas.model.js'
import { UserToUpsert } from './user.interfaces.js'
import { User } from './user.model.js'

import { DatabaseError } from '../errors.js'
import baseLogger from '../logger.js'

const logger = baseLogger.child({ filePath: import.meta.filename })

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
  We check explicitly for true to determine if it was created (otherwise it was updated).
  */
  async upsertUser (userToUpsert: UserToUpsert): Promise<User> {
    try {
      const [record, created] = await this.userModel.upsert({ ...userToUpsert })
      const howChanged = created === true ? 'created' : 'updated'
      logger.info(`User ${record.loginId} was ${howChanged} in 'user' table.`)
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
