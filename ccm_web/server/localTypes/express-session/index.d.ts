import 'express-session'

declare module 'express-session' {

  interface Course {
    id: number
    roles: string[]
  }

  interface CustomData {
    oAuthToken?: string
    course: Course
    isRootAdmin: boolean
  }

  interface SessionData {
    data: CustomData
  }
}
