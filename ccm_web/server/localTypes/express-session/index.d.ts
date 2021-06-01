import 'express-session'

declare module 'express-session' {
  interface CustomData {
    ltiKey: string
  }

  interface SessionData {
    data: CustomData
  }
}
