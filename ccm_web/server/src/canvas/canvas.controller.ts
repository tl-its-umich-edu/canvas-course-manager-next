import crypto from 'crypto'

import { Response } from 'express'
import { Controller, Get, Query, Res } from '@nestjs/common'

import { CanvasService } from './canvas.service'

interface CanvasOAuthResponseQuery {
  code: string
  state: string
}

@Controller('canvas')
export class CanvasController {
  constructor (private readonly canvasService: CanvasService) {}

  @Get('redirectOAuth')
  redirectTo (@Res() response: Response): void {
    // if user is authorized (call DB), skip

    const nonce = crypto.randomBytes(16).toString('base64')

    // Session[nonce] = { ltiKey: res.ltiKey } <= pseudocode

    const fullURL = `${this.canvasService.getAuthURL()}&state=${nonce}`
    console.log(fullURL)
    response.redirect(fullURL)
  }

  // Not behind ltijs authentication, so care is needed
  @Get('returnFromOAuth')
  returnFromOAuth (@Query() query: CanvasOAuthResponseQuery): void {
    console.log(query)
  }
}
