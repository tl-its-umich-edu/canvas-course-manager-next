import { Request } from 'express'
import { Strategy as PassportJwtStrategy } from 'passport-jwt'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'

import { JwtPayload } from './auth.interfaces'
import { UserNotFoundError } from '../user/user.errors'
import { User } from '../user/user.model'
import { UserService } from '../user/user.service'

import { Config } from '../config'

@Injectable()
export class JwtStrategy extends PassportStrategy(PassportJwtStrategy) {
  constructor (
    private readonly configService: ConfigService<Config, true>,
    private readonly userService: UserService
  ) {
    super({
      jwtFromRequest: (req: Request): string | null => {
        if (req.signedCookies.jwt !== undefined) {
          const token = req.signedCookies.jwt as string
          return token
        }
        return null
      },
      ignoreExpiration: false,
      secretOrKey: configService.get('server.tokenSecret', { infer: true })
    })
  }

  async validate (payload: JwtPayload): Promise<User> {
    const { username, sub } = payload
    const user = await this.userService.findUserByLoginId(username)
    // Handling these errors out of abundance of caution
    if (user === null) throw new UserNotFoundError(username)
    if (user.id !== sub) throw new Error('Database ID of User is different from the one in the JWT payload!')
    return user
  }
}
