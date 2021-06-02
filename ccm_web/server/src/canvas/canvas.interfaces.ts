export interface OAuthResponseQuery {
  code: string
  state: string
}

export interface TokenResponseBody {
  access_token: string
  token_type: 'Bearer'
  user: {
    id: number
    name: string
    global_id: string
    effective_locale: string
  }
  refresh_token: string
  expires_in: number
}
