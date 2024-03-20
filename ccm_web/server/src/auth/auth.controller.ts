import { Request, Response } from 'express'
import { BadRequestException, Controller, Get, Req, Res, UseGuards } from '@nestjs/common'
import { ApiExcludeEndpoint } from '@nestjs/swagger'
import { JwtAuthGuard } from './jwt-auth.guard'
import { SessionGuard } from './session.guard'
import { CSRFTokenResponse } from './auth.interfaces'

@UseGuards(JwtAuthGuard, SessionGuard)
@Controller('auth')
export class AuthController {

  @ApiExcludeEndpoint()
  @Get('csrfToken')
  async setCSRFTokenCookie (
    @Req() req: Request, @Res({ passthrough: true }) res: Response
  ): Promise<CSRFTokenResponse> {
    // ): Promise<void> {
    if(req.csrfToken) {
    return {token: req.csrfToken()}
    }
    else {
      throw new BadRequestException('CSRF token not found')
    }
  }
}