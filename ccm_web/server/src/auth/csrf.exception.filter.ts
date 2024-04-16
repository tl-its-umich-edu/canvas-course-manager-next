import { Response } from 'express'
import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common'
import { BaseExceptionFilter } from '@nestjs/core'

import { MaybeCSRFError } from './auth.interfaces.js'

import baseLogger from '../logger.js'

/*
Resource(s):
- https://docs.nestjs.com/exception-filters#inheritance
- https://github.com/nestjs/docs.nestjs.com/issues/215#issuecomment-689714257
- https://github.com/expressjs/csurf#custom-error-handling
*/

const logger = baseLogger.child({ filePath: import.meta.filename })

@Catch()
export class CSRFExceptionFilter<T extends MaybeCSRFError> extends BaseExceptionFilter {
  catch (exception: T, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>()
    if (exception.code === 'EBADCSRFTOKEN') {
      logger.warn(
        'CSRF token verification failed. The request may have been sent without a CSRF token ' +
        'or some other issue might have occurred (e.g. the session was missing). ' +
        'A CSRF attack may be in progress.'
      )
      res.status(HttpStatus.FORBIDDEN).json({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'CSRF token was missing or invalid. Try re-launching the application, or contact support.'
      })
    } else {
      super.catch(exception, host)
    }
  }
}
