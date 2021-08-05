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
      sameSite: 'none',
      maxAge: (configService.get('server.maxAgeInSec') as number) * 1000
    }
  }

  setJWTCookie (res: Response, jwtToken: string): void {
    res.cookie('jwt', jwtToken, { ...this.commonCookieOptions, httpOnly: true, signed: true })
  }

  async loginLTI (userData: UserToUpsert, res: Response): Promise<void> {
    const user = await this.userService.upsertUser(userData)
    // Using bigint type assertion for now, but later it may not be necessary
    const payload = { username: user.loginId, sub: user.id as bigint }
    const jwtToken = this.jwtService.sign(payload)
    this.setJWTCookie(res, jwtToken)
  }
}
