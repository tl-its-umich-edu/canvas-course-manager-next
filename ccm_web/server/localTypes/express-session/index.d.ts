import 'express-session'

declare module 'express-session' {
  interface CustomData {
    ltiKey: string
    userLoginId: string
  }

  interface SessionData {
    data: CustomData
  }
}
