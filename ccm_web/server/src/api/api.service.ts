import { Injectable } from '@nestjs/common'

import { Globals, HelloData } from './api.interfaces'

@Injectable()
export class APIService {
  getHello (): HelloData {
    return {
      message: 'You successfully communicated with the backend server. Hooray!'
    }
  }

  getGlobals (): Globals {
    return {
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
    }
  }
}
