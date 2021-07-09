import { Request } from 'express'
import { Strategy } from 'passport-jwt'
import { PassportStrategy } from '@nestjs/passport'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { JwtPayload } from './auth.interfaces'
import { User } from '../user/user.model'
import { UserService } from '../user/user.service'
import { UserNotFoundError } from '../user/user.errors'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor (
    private readonly configService: ConfigService,
    private readonly userService: UserService
  ) {
    super({
      jwtFromRequest: (req: Request) => {
        if (req.signedCookies.jwt !== undefined) {
          const token = req.signedCookies.jwt
          return token
        }
        return null
      },
      ignoreExpiration: false,
      secretOrKey: configService.get('server.encryptionSecret') as string
    })
  }

  async validate (payload: JwtPayload): Promise<User> {
    const { username, sub } = payload
    const user = await this.userService.findUserByLoginId(payload.username)
    if (user === null) throw new UserNotFoundError(username)
    if (user.id !== sub) throw new Error('Database ID of User is different from the one in the JWT payload!')
    return user
  }
}
