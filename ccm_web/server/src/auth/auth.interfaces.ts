export interface AccessToken {
  access_token: string
}

export interface JwtPayload {
  username: string
  sub: bigint
}
