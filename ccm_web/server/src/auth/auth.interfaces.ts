export interface JwtPayload {
  username: string
  sub: bigint
}

export interface MaybeCSRFError extends Error {
  code?: string
}
