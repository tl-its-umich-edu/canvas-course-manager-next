import { Response } from 'express'
import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common'

import { MaybeCSRFError } from './auth.interfaces'

/*
Resource(s):
- https://github.com/nestjs/docs.nestjs.com/issues/215#issuecomment-689714257
- https://github.com/expressjs/csurf#custom-error-handling
*/

@Catch()
export class CSRFErrorFilter<T extends MaybeCSRFError> implements ExceptionFilter {
  catch (exception: T, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>()
    if (exception.code === 'EBADCSRFTOKEN') {
      res.status(HttpStatus.FORBIDDEN).json({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'CSRF token was missing or invalid.'
      })
    }
  }
}
