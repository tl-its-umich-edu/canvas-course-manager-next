import { Injectable, NestMiddleware } from '@nestjs/common'
import { doubleCsrf } from 'csrf-csrf'
import { NextFunction, Request, Response } from 'express'
import { Config } from '../config'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class DoubleCSRFProtectionMiddleware implements NestMiddleware {

  constructor(private readonly configService: ConfigService<Config, true>) {}
  
  use(req: Request, res: Response, next: NextFunction) {
    const { generateToken } = doubleCsrf({
      getSecret: () => this.configService.get<string>('server.csrfSecret', { infer: true }),
      cookieName: 'x-csrf-token',
      size: 64,
      ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
    })
    req.csrfToken = () => generateToken(req, res)
    next()
  }
}