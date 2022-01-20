import { Request } from 'express'
import {
  CallHandler, ExecutionContext, HttpException, HttpStatus, Injectable, NestInterceptor,
  UnauthorizedException
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { catchError } from 'rxjs/operators'

import { isAPIErrorData } from './api.interfaces'
import { CanvasTokenNotFoundError, InvalidTokenRefreshError } from '../canvas/canvas.errors'
import { CanvasService } from '../canvas/canvas.service'
import { RequestWithoutUserError } from '../user/user.errors'

const INVALID_TOKEN_TEXT = 'invalid access token'
const INSUFFICIENT_SCOPES_TEXT = 'insufficient scopes on access token'

@Injectable()
export class InvalidTokenInterceptor implements NestInterceptor {
  constructor (private readonly canvasService: CanvasService) {}

  async intercept (context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const req = context.switchToHttp().getRequest<Request>()
    const user = req.user
    if (user === undefined) throw new RequestWithoutUserError()

    const redirectErrorBodyBase = { statusCode: 401, message: 'Unauthorized', redirect: true }

    return next.handle().pipe(
      catchError(async (err) => {
        if (err instanceof CanvasTokenNotFoundError) {
          throw new UnauthorizedException(Object.assign(redirectErrorBodyBase, {
            error: 'The tool does not have a Canvas token for you.'
          }))
        }
        // Other unauthorized cases related to JWT or sessions will be caught by guards.
        let existingTokenInvalid = false
        if (err instanceof HttpException) {
          const response = err.getResponse()
          if (isAPIErrorData(response) && response.errors.length > 0) {
            const canvasErrorMessage = response.errors[0].message.toLowerCase()
            if (
              err.getStatus() === HttpStatus.UNAUTHORIZED &&
              (canvasErrorMessage.includes(INVALID_TOKEN_TEXT) || canvasErrorMessage.includes(INSUFFICIENT_SCOPES_TEXT))
            ) {
              existingTokenInvalid = true
            }
          }
        }

        if (err instanceof InvalidTokenRefreshError || existingTokenInvalid) {
          await this.canvasService.deleteTokenForUser(user)
          throw new UnauthorizedException(Object.assign(redirectErrorBodyBase, {
            error: (
              'Your Canvas token was invalid and has been deleted. ' +
              'Canvas settings for the tool may have changed, or your Canvas integration may have been removed.'
            )
          }))
        }
        throw err
      })
    )
  }
}
