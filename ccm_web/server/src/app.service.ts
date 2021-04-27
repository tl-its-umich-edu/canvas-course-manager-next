import { Injectable } from '@nestjs/common'
import { Globals, HelloData } from './app.interfaces'

@Injectable()
export class AppService {
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
