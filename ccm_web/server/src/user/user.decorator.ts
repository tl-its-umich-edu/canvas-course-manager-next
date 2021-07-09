import { Request } from 'express'
import { createParamDecorator, ExecutionContext } from '@nestjs/common'

import { User } from './user.model'

export const UserDec = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<Request>()
    if (request.user === undefined) {
      throw new Error('The request does not have a User record attached to it.')
    }
    return request.user
  }
)
