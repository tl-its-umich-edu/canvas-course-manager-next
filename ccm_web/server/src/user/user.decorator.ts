import { Request } from 'express'
import { createParamDecorator, ExecutionContext } from '@nestjs/common'

import { User } from './user.model.js'
import { RequestWithoutUserError } from './user.errors.js'

export const UserDec = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<Request>()
    if (request.user === undefined) throw new RequestWithoutUserError()
    return request.user
  }
)
