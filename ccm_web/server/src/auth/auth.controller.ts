import { Request, Response } from 'express'
import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common'
import { ApiExcludeEndpoint } from '@nestjs/swagger'

import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import { SessionGuard } from './session.guard'

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
    res.cookie('CSRF-Token', req.csrfToken(), this.authService.commonCookieOptions)
  }
}
