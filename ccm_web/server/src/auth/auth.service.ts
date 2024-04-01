import { CookieOptions, Response } from 'express'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'

import { UserToUpsert } from '../user/user.interfaces.js'
import { UserService } from '../user/user.service.js'

import { Config } from '../config.js'

@Injectable()
export class AuthService {
  readonly commonCookieOptions: CookieOptions

  constructor (
    private readonly configService: ConfigService<Config, true>,
    private readonly userService: UserService,
    private readonly jwtService: JwtService
  ) {
    this.commonCookieOptions = {
      secure: true,
      sameSite: 'none',
      maxAge: (configService.get('server.maxAgeInSec', { infer: true })) * 1000
    }
  }

  setJWTCookie (res: Response, jwtToken: string): void {
    res.cookie('jwt', jwtToken, { ...this.commonCookieOptions, httpOnly: true, signed: true })
  }

  async loginLTI (userData: UserToUpsert, res: Response): Promise<void> {
    console.log('loginLTI')
    const user = await this.userService.upsertUser(userData)
    const payload = { username: user.loginId, sub: user.id }
    const jwtToken = this.jwtService.sign(payload)
    this.setJWTCookie(res, jwtToken)
  }
}
