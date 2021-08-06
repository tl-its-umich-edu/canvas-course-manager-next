import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Request } from 'express'
import { Observable } from 'rxjs'

@Injectable()
export class SessionGuard implements CanActivate {
  canActivate (
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>()

    const { expires } = request.session.cookie
    const curTime = new Date()
    if ((expires !== undefined && expires < curTime) || request.session.data === undefined) {
      throw new UnauthorizedException('The session has expired or is missing.')
    }
    return true
  }
}
