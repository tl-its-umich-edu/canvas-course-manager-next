import { OAuthErrorResponseQuery, OAuthGoodResponseQuery } from './canvas.interfaces'

export const isOAuthErrorResponseQuery = (data: OAuthErrorResponseQuery | OAuthGoodResponseQuery): data is OAuthErrorResponseQuery => {
  return 'error' in data && 'error_description' in data
}
