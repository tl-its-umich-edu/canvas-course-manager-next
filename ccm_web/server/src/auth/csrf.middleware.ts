import csurf from 'csurf'
import { NextFunction, Request, RequestHandler, Response } from 'express'
import { Injectable, NestMiddleware } from '@nestjs/common'

import { AuthService } from './auth.service'

/*
Wrapper for csurf so that it can be installed after LTI middleware (which uses POSTs)
See https://www.npmjs.com/package/csurf
*/

@Injectable()
export class CSRFProtectionMiddleware implements NestMiddleware {
  csurf: RequestHandler

  constructor (private readonly authService: AuthService) {
    this.csurf = csurf({
      cookie: {
        ...this.authService.commonCookieOptions,
        ...this.authService.protectedCookieOptions,
        // csurf uses seconds for maxAge, instead of milliseconds like Express.
        maxAge: this.authService.maxAgeInSec
      }
    })
  }

  use (req: Request, res: Response, next: NextFunction): void {
    this.csurf(req, res, next)
  }
}
