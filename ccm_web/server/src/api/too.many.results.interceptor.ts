import {
  CallHandler, ExecutionContext, ForbiddenException, Injectable, NestInterceptor
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { catchError } from 'rxjs/operators'

import { TooManyResultsError } from './api.errors'

@Injectable()
export class TooManyResultsInterceptor implements NestInterceptor {
  limitedEntityNamePlural: string

  constructor (limitedEntityNamePlural: string) {
    this.limitedEntityNamePlural = limitedEntityNamePlural
  }

  async intercept (context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    return next.handle().pipe(
      catchError(async (err) => {
        if (err instanceof TooManyResultsError) {
          throw new ForbiddenException(
            `Too many ${this.limitedEntityNamePlural} matched your search term; please refine your search.`
          )
        }
        throw err
      })
    )
  }
}
