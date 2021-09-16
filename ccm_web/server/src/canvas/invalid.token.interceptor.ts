import { Request } from 'express'
import {
  CallHandler, ExecutionContext, HttpException, HttpStatus, Injectable, NestInterceptor,
  UnauthorizedException
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { catchError } from 'rxjs/operators'

import { CanvasTokenNotFoundError, InvalidTokenRefreshError } from './canvas.errors'
import { CanvasService } from './canvas.service'
import { RequestWithoutUserError } from '../user/user.errors'

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
        if (
          err instanceof InvalidTokenRefreshError ||
          (err instanceof HttpException && err.getStatus() === HttpStatus.UNAUTHORIZED)
        ) {
          await this.canvasService.deleteTokenForUser(user)
          throw new UnauthorizedException(Object.assign(redirectErrorBodyBase, {
            error: (
              'Your Canvas token was invalid and has been deleted; ' +
              'your integration for the tool in Canvas may have been removed.'
            )
          }))
        }
        throw err
      })
    )
  }
}
