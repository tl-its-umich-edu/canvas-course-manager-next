import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { privilegeLevelOneScopes } from './canvas.scopes'

@Injectable()
export class CanvasService {
  clientId: string
  secret: string
  url: string

  constructor (private readonly configService: ConfigService) {
    this.clientId = configService.get('canvas.apiClientId') as string
    this.secret = configService.get('canvas.apiSecret') as string
    this.url = configService.get('canvas.instanceURL') as string
  }

  getAuthURL (): string {
    const params = {
      client_id: this.clientId,
      response_type: 'code',
      scope: privilegeLevelOneScopes.join(' '),
      redirect_uri: `https://${this.configService.get('server.domain') as string}/canvas/returnFromOAuth`
      // state (handled by controller?)
    }
    const searchParams = new URLSearchParams()
    Object.entries(params).map(([key, value]) => searchParams.append(key, value))
    return `${this.url}/login/oauth2/auth?${searchParams.toString()}`
  }

  // createCanvasToken (code: string) {
  //   // make a call to the api with the code and secret
  //   // store access token that was created with TTL and refesh token in DB
  // }

  // getCanvasToken
  // From the database (either in the User table, or another table connected by FK to User)

  // initiateOAuthFlow
}
