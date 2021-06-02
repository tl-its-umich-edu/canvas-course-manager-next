import { Injectable } from '@nestjs/common'

import { CanvasService } from '../canvas/canvas.service'

import { Globals, HelloData } from './api.interfaces'

@Injectable()
export class APIService {
  constructor (private readonly canvasService: CanvasService) {}

  getHello (): HelloData {
    return {
      message: 'You successfully communicated with the backend server. Hooray!'
    }
  }

  getGlobals (): Globals {
    return {
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      user: {
        hasAuthorized: false
      }
    }
  }
}
