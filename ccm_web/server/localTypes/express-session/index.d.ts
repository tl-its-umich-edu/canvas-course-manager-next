import 'express-session'

declare module 'express-session' {

  interface course {
    id: number
    roles: string[]
  }
  interface CustomData {
    ltiKey: string
    userLoginId: string
    course: course
    isRootAdmin: boolean
  }

  interface SessionData {
    data: CustomData
  }
}
