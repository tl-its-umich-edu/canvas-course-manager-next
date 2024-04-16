import crypto from 'crypto'
import { promisify } from 'util'

import type { Request, Response } from 'express'
import {
  BadRequestException, Controller, Get, InternalServerErrorException, Query, Req, Res,
  UnauthorizedException, UseGuards
} from '@nestjs/common'
import { ApiExcludeEndpoint } from '@nestjs/swagger'

import { isOAuthGoodResponseQuery, isOAuthErrorResponseQuery } from './canvas.interfaces.js'
import { CanvasService } from './canvas.service.js'
import { CanvasOAuthReturnQueryDto } from './dtos/canvas.oauth.query.dto.js'
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js'
import { SessionGuard } from '../auth/session.guard.js'
import { UserDec } from '../user/user.decorator.js'
import { User } from '../user/user.model.js'

import baseLogger from '../logger.js'

const logger = baseLogger.child({ filePath: import.meta.filename })

const generateToken = promisify(crypto.randomBytes)

@UseGuards(JwtAuthGuard, SessionGuard)
@Controller('canvas')
export class CanvasController {
  constructor (private readonly canvasService: CanvasService) {}

  @ApiExcludeEndpoint()
  @Get('redirectOAuth')
  async redirectToOAuth (
    @Req() req: Request, @Res() res: Response, @UserDec() user: User
  ): Promise<void> {
    logger.debug('Pulling session data, checking for Canvas token, and redirecting to Canvas for OAuth...')

    if (req.session.data === undefined) {
      logger.warn('Failed to find needed session data; throwing an internal server error...')
      throw new InternalServerErrorException('Session data could not be found.')
    }

    if (user.canvasToken !== null) {
      logger.warn(`User ${user.loginId} already has a CanvasToken record; redirecting to home page...`)
      return res.redirect('/')
    }

    const stateToken = (await generateToken(48)).toString('hex')
    req.session.data.oAuthToken = stateToken
    const fullURL = `${this.canvasService.getAuthURL()}&state=${stateToken}`
    logger.debug(`Full redirect URL: ${fullURL}`)
    req.session.save(() => { res.redirect(fullURL) })
  }

  @ApiExcludeEndpoint()
  @Get('returnFromOAuth')
  async returnFromOAuth (
    @Query() query: CanvasOAuthReturnQueryDto,
      @Req() req: Request, @Res() res: Response, @UserDec() user: User
  ): Promise<void> {
    logger.debug(`Query: ${JSON.stringify(query, null, 2)}`)
    if (!(isOAuthGoodResponseQuery(query) || isOAuthErrorResponseQuery(query))) {
      throw new BadRequestException('Query returned from Canvas could not be interpreted.')
    }

    if (isOAuthErrorResponseQuery(query)) {
      if (query.error === 'access_denied') {
        logger.debug('User rejected Canvas OAuth; sending them back to application root...')
        res.redirect('/')
        return
      }

      logger.error(`Canvas OAuth failed due to ${query.error}: ${String(query.error_description)}`)
      const message = query.error_description !== undefined
        ? `"${query.error_description}"`
        : 'no description was provided.'
      throw new InternalServerErrorException(`Canvas OAuth error encountered: ${message}`)
    }

    logger.debug('Comparing session to state parameter, and creating new Canvas token if matching')
    logger.debug(`Session: ${JSON.stringify(req.session, null, 2)}`)
    if (req.session.data === undefined) {
      logger.warn('Failed to find needed session data; throwing an internal server error exception...')
      throw new InternalServerErrorException('Session data could not be found.')
    }

    const { oAuthToken } = req.session.data
    if (oAuthToken === undefined || query.state !== oAuthToken) {
      logger.warn(
        'The state variable returned from Canvas did not match the oAuthToken value in the session, or ' +
        'the oAuthToken value was undefined.'
      )
      throw new UnauthorizedException('You are not authorized to access this resource.')
    }

    await this.canvasService.createTokenForUser(user, query.code)
    res.redirect('/')
  }
}
