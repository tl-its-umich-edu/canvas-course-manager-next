import csurf from 'csurf'
import { NextFunction, Request, RequestHandler, Response } from 'express'
import { Injectable, NestMiddleware } from '@nestjs/common'

/*
Wrapper for csurf so that it can be installed after LTI middleware (which uses POSTs)
See https://www.npmjs.com/package/csurf
*/

@Injectable()
export class CSRFProtectionMiddleware implements NestMiddleware {
  csurf: RequestHandler

  constructor () {
    this.csurf = csurf()
  }

  use (req: Request, res: Response, next: NextFunction): void {
    this.csurf(req, res, next)
  }
}
