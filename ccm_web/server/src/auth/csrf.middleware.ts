import csurf from 'csurf'
import { Request, RequestHandler, Response, NextFunction } from 'express'
import { ConfigService } from '@nestjs/config'
import { Injectable, NestMiddleware } from '@nestjs/common'

/*
Wrapper for csurf so that it can be installed after LTI middleware (which uses POSTs)
See https://www.npmjs.com/package/csurf
*/

@Injectable()
export class CSRFProtectionMiddleware implements NestMiddleware {
  csurf: RequestHandler

  constructor (private readonly configService: ConfigService) {
    this.csurf = csurf({
      cookie: {
        domain: configService.get<string>('server.domain'),
        secure: true,
        sameSite: 'none',
        signed: true,
        httpOnly: true
      }
    })
  }

  use (req: Request, res: Response, next: NextFunction): void {
    this.csurf(req, res, next)
  }
}
