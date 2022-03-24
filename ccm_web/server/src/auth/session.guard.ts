import { Request } from 'express'
import { Observable } from 'rxjs'
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { session } from 'passport'

@Injectable()
export class SessionGuard implements CanActivate {
  canActivate (
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>()

    const { expires } = request.session.cookie
    const sessData = request.session.data
    console.log(`^^^^^^^^^^^^^^^^ BEFORE ${JSON.stringify(sessData)}`)
    const curTime = new Date()
    if ((expires !== undefined && expires < curTime) || request.session.data === undefined) {
      // request.session.resetMaxAge()
      // throw new UnauthorizedException('The session has expired or is missing.')
      // request.session.regenerate((err) => {
      //   if (err !== null) {
      //     console.log(`()()()()()()()()()()()() AFTER ${JSON.stringify(request.session.data)}`)
      //     throw new UnauthorizedException('The session has expired or is missing.')
      //   }
      // })
      // Object.assign(request.session.data, sessData)
      // request.session.data = sessData
      // request.session.save((err) => {
      //   if (err !== null) {
      //     console.log('Failed to save session data due to error: ', err)
      //     throw new UnauthorizedException('The session has expired or is missing.')
      //   }
      //   console.log(`@@@@@@@@@@@@@@@@@ AFTER ${JSON.stringify(request.session.data)}`)
      // })
    }
    return true
  }
}
