/*
Interfaces for common objects and entities (e.g. Globals, Course, Section, etc.)
*/

export interface Globals {
  environment: 'production' | 'development'
  canvasAuthURL: string
  user?: {
    hasAuthorized: boolean
  }
}

export interface HelloMessageData {
  message: string
}
