import { Request } from 'express'
import { Observable } from 'rxjs'
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'

@Injectable()
export class SessionGuard implements CanActivate {
  canActivate (
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>()

    if (request.session.data === undefined) {
      throw new UnauthorizedException('The session has expired or is missing.')
    }
    return true
  }
}
