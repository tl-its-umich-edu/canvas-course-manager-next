import { Express, Request, Response, NextFunction } from 'express'
import { Injectable, NestMiddleware } from '@nestjs/common'

import { LTIService } from './lti.service'

import baseLogger from '../logger'

const logger = baseLogger.child({ filePath: __filename })

@Injectable()
export class LTIMiddleware implements NestMiddleware {
  ltiMiddleware: Express | undefined

  constructor (private readonly ltiService: LTIService) {
    this.ltiService.setUpLTI()
      .then(app => {
        this.ltiMiddleware = app
        logger.info('ltijs was successfully set up.')
      })
      .catch(e => {
        this.ltiMiddleware = undefined
        throw new Error(`An error occurred while setting up ltijs: ${String(e)}`)
      })
  }

  async use (req: Request, res: Response, next: NextFunction) {
    if (this.ltiMiddleware !== undefined) this.ltiMiddleware(req, res, next)
  }
}
