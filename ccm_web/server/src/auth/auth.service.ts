import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import { AccessToken } from './auth.interfaces'
import { UserToUpsert } from '../user/user.interfaces'
import { UserService } from '../user/user.service'

@Injectable()
export class AuthService {
  constructor (
    private readonly userService: UserService,
    private readonly jwtService: JwtService
  ) {}

  async loginLTI (userData: UserToUpsert): Promise<AccessToken> {
    const user = await this.userService.upsertUser(userData)
    // TO DO: look at how the id primary keys are set up
    const payload = { username: user.loginId, sub: user.id as bigint }
    return { access_token: this.jwtService.sign(payload) }
  }
}
