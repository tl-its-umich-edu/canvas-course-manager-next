/*
Interfaces for common objects and entities (e.g. Globals, Course, Section, etc.)
*/

export interface Globals {
  environment: 'production' | 'development'
  userLoginId: string
  course: {
    id: number
    roles: string[]
  }
}

export interface HelloMessageData {
  message: string
}
