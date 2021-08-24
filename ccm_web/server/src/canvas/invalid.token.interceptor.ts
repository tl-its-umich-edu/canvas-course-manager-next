import { Request } from 'express'
import { CallHandler, ExecutionContext, HttpException, HttpStatus, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'
import { catchError } from 'rxjs/operators'

import { CanvasService } from './canvas.service'
import { RequestWithoutUserError } from '../user/user.errors'

@Injectable()
export class InvalidTokenInterceptor implements NestInterceptor {
  constructor (private readonly canvasService: CanvasService) {}

  async intercept (context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const req = context.switchToHttp().getRequest<Request>()
    const user = req.user
    if (user === undefined) throw new RequestWithoutUserError()

    return next.handle().pipe(
      catchError(async (err) => {
        if (err instanceof HttpException && err.getStatus() === HttpStatus.UNAUTHORIZED) {
          await this.canvasService.deleteTokenForUser(user)
        }
        throw err
      })
    )
  }
}
