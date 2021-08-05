import { Request, Response } from 'express'
import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common'
import { ApiExcludeEndpoint } from '@nestjs/swagger'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AuthService } from './auth.service'

@UseGuards(JwtAuthGuard)
@Controller('auth')
export class AuthController {
  constructor (private readonly authService: AuthService) {}

  @ApiExcludeEndpoint()
  @Get('csrfToken')
  async setCSRFTokenCookie (
    @Req() req: Request, @Res({ passthrough: true }) res: Response
  ): Promise<void> {
    // Cookie options deliberately include defaults of httpOnly false and signed false.
    res.cookie('CSRF-Token', req.csrfToken(), {
      ...this.authService.commonCookieOptions,
      maxAge: this.authService.maxAgeInSec * 1000
    })
  }
}
