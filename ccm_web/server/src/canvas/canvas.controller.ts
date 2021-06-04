import { Request, Response } from 'express'
import {
  Controller, Get, InternalServerErrorException, Query, Req, Res, UnauthorizedException
} from '@nestjs/common'

import { OAuthResponseQuery } from './canvas.interfaces'
import { CanvasService } from './canvas.service'
import { LTIUser } from '../lti/lti.decorators'

import baseLogger from '../logger'

const logger = baseLogger.child({ filePath: __filename })

@Controller('canvas')
export class CanvasController {
  constructor (private readonly canvasService: CanvasService) {}

  @Get('redirectOAuth')
  async redirectToOAuth (
    @Req() req: Request, @Res() res: Response, @LTIUser() ltiUser: string
  ): Promise<void> {
    logger.debug('Updating session and redirecting to Canvas for OAuth')
    const token = await this.canvasService.findToken(ltiUser)
    const sessionData = { ltiKey: res.locals.ltik as string, userLoginId: ltiUser }

    if (req.session.data === undefined) {
      req.session.data = sessionData
    } else {
      req.session.data = Object.assign(req.session.data, sessionData)
    }

    req.session.save((err) => {
      logger.debug(`Session ID: ${req.sessionID}`)
      logger.debug(JSON.stringify(req.session, null, 2))

      if (token !== null) {
        logger.debug(`User ${ltiUser} already has a CanvasToken record, redirecting to home page...`)
        return res.redirect(`/?ltik=${sessionData.ltiKey}`)
      }
      const fullURL = `${this.canvasService.getAuthURL()}&state=${req.sessionID}`
      logger.debug(`Full redirect URL: ${fullURL}`)
      if (err !== null) throw new Error(err)
      res.redirect(fullURL)
    })
  }

  /*
  Not behind ltijs authentication; this seems necessary, right?
  See provider.whitelist in LTIService
  */
  @Get('returnFromOAuth')
  async returnFromOAuth (
    @Query() query: OAuthResponseQuery, @Req() req: Request, @Res() res: Response
  ): Promise<void> {
    logger.debug('Comparing session to state parameter, and creating new Canvas token if matching')
    logger.debug(`Session ID: ${req.sessionID}`)
    logger.debug(JSON.stringify(req.session, null, 2))

    if (req.sessionID !== query.state) throw new UnauthorizedException()

    if (req.session.data === undefined) {
      throw new InternalServerErrorException('Session data from before redirect is not available!')
    }

    // Create token for user
    const tokenCreated = await this.canvasService.createTokenForUser(req.session.data.userLoginId, query.code)
    if (!tokenCreated) throw new InternalServerErrorException()

    res.redirect(`/?ltik=${req.session.data.ltiKey}`)
  }
}
