import { Request, Response } from 'express'
import {
  Controller, Get, InternalServerErrorException, Query, Req, Res, UnauthorizedException
} from '@nestjs/common'

import { OAuthGoodResponseQuery, OAuthErrorResponseQuery, isOAuthErrorResponseQuery } from './canvas.interfaces'
import { CanvasService } from './canvas.service'

import baseLogger from '../logger'

const logger = baseLogger.child({ filePath: __filename })

@Controller('canvas')
export class CanvasController {
  constructor (private readonly canvasService: CanvasService) {}

  @Get('redirectOAuth')
  async redirectToOAuth (
    @Req() req: Request, @Res() res: Response
  ): Promise<void> {
    logger.debug('Pulling session data, checking for Canvas token, and redirecting to Canvas for OAuth...')

    if (req.session.data === undefined) {
      logger.warn('Failed to find needed session data; throwing an internal server error...')
      throw new InternalServerErrorException('Session data could not be found.')
    }

    const { ltiKey, userLoginId } = req.session.data

    const token = await this.canvasService.findToken(userLoginId)
    if (token !== null) {
      logger.debug(`User ${userLoginId} already has a CanvasToken record; redirecting to home page...`)
      return res.redirect(`/?ltik=${ltiKey}`)
    }

    const fullURL = `${this.canvasService.getAuthURL()}&state=${req.sessionID}`
    logger.debug(`Full redirect URL: ${fullURL}`)
    res.redirect(fullURL)
  }

  /*
  Not behind ltijs authentication; this seems necessary, right?
  See provider.whitelist in LTIService
  */
  @Get('returnFromOAuth')
  async returnFromOAuth (
    @Query() query: OAuthGoodResponseQuery | OAuthErrorResponseQuery, @Req() req: Request, @Res() res: Response
  ): Promise<void> {
    logger.debug('Comparing session to state parameter, and creating new Canvas token if matching')
    logger.debug(`Session ID: ${req.sessionID}`)
    logger.debug(JSON.stringify(req.session, null, 2))

    if (isOAuthErrorResponseQuery(query)) {
      logger.error(`Canvas OAuth failed  due to ${query.error}. ${query.error_description}`)
      throw new InternalServerErrorException(query.error_description)
    }

    if (req.sessionID !== query.state) {
      logger.warn('State variable returned from Canvas did not match session ID; throwing unauthorized exception...')
      throw new UnauthorizedException('You are not authorized to access this resource.')
    }

    if (req.session.data === undefined) {
      logger.warn('Failed to find needed session data; throwing an internal server error exception...')
      throw new InternalServerErrorException('Session data could not be found.')
    }

    // Create token for user
    const { ltiKey, userLoginId } = req.session.data
    await this.canvasService.createTokenForUser(userLoginId, query.code)

    res.redirect(`/?ltik=${ltiKey}`)
  }
}
