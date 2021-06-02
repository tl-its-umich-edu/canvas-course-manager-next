import { Request, Response } from 'express'
import { CustomData } from 'express-session'
import {
  Controller, Get, InternalServerErrorException, Query, Req, Res, UnauthorizedException
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { OAuthResponseQuery } from './canvas.interfaces'
import { CanvasService } from './canvas.service'
import { LTIUser } from '../lti/lti.decorators'
import { Session as SessionModel } from '../session/session.model'

import baseLogger from '../logger'

const logger = baseLogger.child({ filePath: __filename })

@Controller('canvas')
export class CanvasController {
  constructor (
    private readonly canvasService: CanvasService,
    @InjectModel(SessionModel)
    private readonly sessionModel: typeof SessionModel
  ) {}

  @Get('redirectOAuth')
  redirectToOAuth (
    @Req() req: Request, @Res() res: Response, @LTIUser() ltiUser: string
  ): void {
    // TO DO: if user has authorized Canvas API usage (call DB), skip

    if (req.session.data === undefined) {
      req.session.data = { ltiKey: res.locals.ltik, userLoginId: ltiUser }
    } else {
      req.session.data.ltiKey = res.locals.ltik
      req.session.data.userLoginId = ltiUser
    }

    req.session.save((err) => {
      logger.debug(`Sesssion ID: ${req.sessionID}`)
      logger.debug(JSON.stringify(req.session, null, 2))
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
    // Would reloading help re-establish earlier Session after redirect? Doesn't seem to
    // req.session.reload((err) => {
    //   if (err !== null && err !== undefined) throw new Error(err)
    //   logger.debug(`Session ID: ${req.sessionID}`)
    //   logger.debug(JSON.stringify(req.session, null, 2))
    // })

    // Log new session
    logger.debug(`Session ID: ${req.sessionID}`)
    logger.debug(JSON.stringify(req.session, null, 2))

    // Get old session, add custom data to new one
    let oldSession: SessionModel | null
    try {
      oldSession = await this.sessionModel.findOne({ where: { sid: query.state } })
    } catch (e) {
      logger.error('Problem when querying database for old session: ', e)
      throw new InternalServerErrorException()
    }
    if (oldSession === null) throw new UnauthorizedException()
    const prevData = JSON.parse(oldSession.data).data as CustomData
    req.session.data = prevData

    // Destroy old session
    try {
      await oldSession.destroy()
    } catch (e) {
      logger.error('Problem when deleting old session: ', e)
      throw new InternalServerErrorException()
    }

    // Create token for user
    const tokenCreated = await this.canvasService.createTokenForUser(req.session.data.userLoginId, query.code)
    if (!tokenCreated) throw new InternalServerErrorException()

    // Save changes to new session and redirect
    req.session.save((err) => {
      // Delete old session
      if (err !== null) throw new Error(err)
      res.redirect(`/?ltik=${prevData.ltiKey}`)
    })
  }
}
