import { Response } from 'express'
import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const LTIUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const response = ctx.switchToHttp().getResponse<Response>()
    const loginId = response.locals?.token?.platformContext.custom?.login_id
    if (loginId === undefined) {
      throw new Error('LTI data is improperly configured.')
    }
    return loginId as string
  }
)
