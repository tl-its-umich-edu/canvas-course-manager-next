import 'express-session'

declare module 'express-session' {
  interface CustomData {
    ltiKey: string
    userLoginId: string
    courseId: number
    roles: string[]
    isRootAdmin: boolean
  }

  interface SessionData {
    data: CustomData
  }
}
