import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'

import { Response as ExpressResponse } from 'express'

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching#the_cache-control_header

@Injectable()
export class NoCacheInterceptor implements NestInterceptor {
  intercept (context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const responseObj: ExpressResponse = context.switchToHttp().getResponse()
    responseObj.setHeader('Cache-Control', 'no-store')
    return next.handle()
  }
}
