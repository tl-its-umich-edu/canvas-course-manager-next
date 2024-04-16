import { Express, Request, Response, NextFunction } from 'express'
import { Injectable, NestMiddleware } from '@nestjs/common'

import { LTIService } from './lti.service.js'

@Injectable()
export class LTIMiddleware implements NestMiddleware {
  ltiMiddleware: Express | undefined

  constructor (private readonly ltiService: LTIService) {
    this.ltiMiddleware = this.ltiService.getMiddleware()
  }

  async use (req: Request, res: Response, next: NextFunction): Promise<void> {
    if (this.ltiMiddleware !== undefined) this.ltiMiddleware(req, res, next)
  }
}
