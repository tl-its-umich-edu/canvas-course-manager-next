export interface JwtPayload {
  username: string
  sub: bigint
  iat: number
  exp: number
}

export interface MaybeCSRFError extends Error {
  code?: string
}
