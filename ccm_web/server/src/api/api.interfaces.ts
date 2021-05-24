export interface HelloData {
  message: string
}

export interface Globals {
  environment: 'production' | 'development'
  canvasAuthURL: string
  user?: {
    hasAuthorized: boolean
  }
}
