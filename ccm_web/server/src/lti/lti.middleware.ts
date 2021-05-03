import { Injectable, NestMiddleware } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Express, Request, Response, NextFunction } from 'express'

import { DatabaseConfig, LTIConfig } from '../config'
import setUpLTI from './lti.setup'

@Injectable()
export class LTIMiddleware implements NestMiddleware {
  ltiMiddleware: Express | undefined

  constructor (private readonly configService: ConfigService) {}

  public async setLTIMiddleware (): Promise<Express> {
    const dbConfig = this.configService.get('db') as DatabaseConfig
    const ltiConfig = this.configService.get('lti') as LTIConfig

    const ltiMiddleware = await setUpLTI(dbConfig, ltiConfig)
    this.ltiMiddleware = ltiMiddleware
    return ltiMiddleware
  }

  async use (req: Request, res: Response, next: NextFunction) {
    let ltiMiddleware
    if (this.ltiMiddleware === undefined) {
      ltiMiddleware = await this.setLTIMiddleware()
    } else {
      ltiMiddleware = this.ltiMiddleware
    }
    ltiMiddleware(req, res, next)
  }
}
