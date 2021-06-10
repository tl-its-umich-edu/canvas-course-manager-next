import { Injectable } from '@nestjs/common'
import { SessionData } from 'express-session'

import { Globals, HelloData } from './api.interfaces'

@Injectable()
export class APIService {
  getHello (): HelloData {
    return {
      message: 'You successfully communicated with the backend server. Hooray!'
    }
  }

  getGlobals (sessionData: SessionData): Globals {
    return {
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      userLoginId: sessionData.data.userLoginId,
      courseId: sessionData.data.courseId,
      roles: sessionData.data.roles
    }
  }
}
