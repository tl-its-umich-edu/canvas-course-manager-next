export interface HelloData {
  message: string
}

export interface Globals {
  environment: 'production' | 'development'
  user?: {
    hasAuthorized: boolean
  }
}
