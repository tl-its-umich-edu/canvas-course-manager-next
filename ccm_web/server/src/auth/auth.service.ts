import { CookieOptions, Response } from 'express'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'

import { UserToUpsert } from '../user/user.interfaces'
import { UserService } from '../user/user.service'

@Injectable()
export class AuthService {
  readonly commonCookieOptions: CookieOptions

  constructor (
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService
  ) {
    this.commonCookieOptions = {
      secure: true,
      domain: this.configService.get('server.domain') as string,
      sameSite: 'none'
    }
  }

  setJWTCookie (res: Response, jwtToken: string): void {
    res.cookie('jwt', jwtToken, { httpOnly: true, signed: true, ...this.commonCookieOptions })
  }

  async loginLTI (userData: UserToUpsert, res: Response): Promise<void> {
    const user = await this.userService.upsertUser(userData)
    // TO DO: look at how the id primary keys are set up
    const payload = { username: user.loginId, sub: user.id as bigint }
    const jwtToken = this.jwtService.sign(payload)
    this.setJWTCookie(res, jwtToken)
  }
}
