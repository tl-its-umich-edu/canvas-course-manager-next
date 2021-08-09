import { Response } from 'express'
import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common'
import { BaseExceptionFilter } from '@nestjs/core'

import { MaybeCSRFError } from './auth.interfaces'

import baseLogger from '../logger'

/*
Resource(s):
- https://docs.nestjs.com/exception-filters#inheritance
- https://github.com/nestjs/docs.nestjs.com/issues/215#issuecomment-689714257
- https://github.com/expressjs/csurf#custom-error-handling
*/

const logger = baseLogger.child({ filePath: __filename })

@Catch()
export class CSRFExceptionFilter<T extends MaybeCSRFError> extends BaseExceptionFilter {
  catch (exception: T, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>()
    if (exception.code === 'EBADCSRFTOKEN') {
      logger.warn('Request was sent without a CSRF token in a header; a CSRF attack may be in progress.')
      res.status(HttpStatus.FORBIDDEN).json({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'CSRF token was missing or invalid.'
      })
    } else {
      super.catch(exception, host)
    }
  }
}
