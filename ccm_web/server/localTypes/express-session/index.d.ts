import 'express-session'

declare module 'express-session' {

  interface Course {
    id: number
    roles: string[]
  }

  interface CustomData {
    userLoginId: string
    course: course
    isRootAdmin: boolean
  }

  interface SessionData {
    data: CustomData
  }
}
