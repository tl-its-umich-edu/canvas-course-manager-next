import crypto from 'crypto'
import { promisify } from 'util'

import { Request, Response } from 'express'
import {
  Controller, Get, InternalServerErrorException, Query, Req, Res, UnauthorizedException, UseGuards
} from '@nestjs/common'
import { ApiExcludeEndpoint } from '@nestjs/swagger'

import { OAuthGoodResponseQuery, OAuthErrorResponseQuery, isOAuthErrorResponseQuery } from './canvas.interfaces'
import { CanvasService } from './canvas.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { SessionGuard } from '../auth/session.guard'
import { UserDec } from '../user/user.decorator'
import { User } from '../user/user.model'

import baseLogger from '../logger'

const logger = baseLogger.child({ filePath: __filename })

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
    req.session.data.state = stateToken
    const fullURL = `${this.canvasService.getAuthURL()}&state=${stateToken}`
    logger.debug(`Full redirect URL: ${fullURL}`)
    req.session.save(() => { res.redirect(fullURL) })
  }

  @ApiExcludeEndpoint()
  @Get('returnFromOAuth')
  async returnFromOAuth (
    @Query() query: OAuthGoodResponseQuery | OAuthErrorResponseQuery,
      @Req() req: Request, @Res() res: Response, @UserDec() user: User
  ): Promise<void> {
    logger.debug(`Query: ${JSON.stringify(query, null, 2)}`)
    if (isOAuthErrorResponseQuery(query)) {
      if (query.error === 'access_denied') {
        logger.debug('User rejected Canvas OAuth; sending them back to application root...')
        res.redirect('/')
        return
      }

      logger.error(`Canvas OAuth failed due to ${query.error}: ${String(query.error_description)}`)
      const message = query.error_description !== undefined
        ? query.error_description
        : 'Canvas OAuth error was sent without a description.'
      throw new InternalServerErrorException(message)
    }

    logger.debug('Comparing session to state parameter, and creating new Canvas token if matching')
    logger.debug(`Session: ${JSON.stringify(req.session, null, 2)}`)
    if (req.session.data === undefined) {
      logger.warn('Failed to find needed session data; throwing an internal server error exception...')
      throw new InternalServerErrorException('Session data could not be found.')
    }

    const { state } = req.session.data
    if (state === undefined || query.state !== state) {
      logger.warn(
        'The state variable returned from Canvas did not match that in the session, or ' +
        'the state variable in the session was undefined.'
      )
      throw new UnauthorizedException('You are not authorized to access this resource.')
    }

    await this.canvasService.createTokenForUser(user, query.code)
    res.redirect('/')
  }
}
