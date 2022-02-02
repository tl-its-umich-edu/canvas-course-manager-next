import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'

import { Response as ExpressResponse } from 'express'

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching#the_cache-control_header

@Injectable()
export class CacheControlToHeaderInterceptor implements NestInterceptor {
  intercept (context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ResponseObj: ExpressResponse = context.switchToHttp().getResponse()
    ResponseObj.setHeader('Cache-Control', 'no-store')
    return next.handle()
  }
}
