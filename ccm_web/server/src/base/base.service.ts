import { Injectable } from '@nestjs/common'

import { Globals, HelloData } from './base.interfaces'

@Injectable()
export class BaseService {
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
