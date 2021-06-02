import got from 'got'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { privilegeLevelOneScopes } from './canvas.scopes'
import { CanvasConfig } from '../config'

import baseLogger from '../logger'

const logger = baseLogger.child({ filePath: __filename })

@Injectable()
export class CanvasService {
  clientId: string
  secret: string
  url: string
  redirectURI: string

  constructor (private readonly configService: ConfigService) {
    const canvasConfig = configService.get('canvas') as CanvasConfig
    this.clientId = canvasConfig.apiClientId
    this.secret = canvasConfig.apiSecret
    this.url = canvasConfig.instanceURL
    this.redirectURI = `https://${this.configService.get('server.domain') as string}/canvas/returnFromOAuth`
  }

  getAuthURL (): string {
    const params = {
      client_id: this.clientId,
      response_type: 'code',
      scope: privilegeLevelOneScopes.join(' '),
      redirect_uri: this.redirectURI
      // state (handled by controller?)
    }
    const searchParams = new URLSearchParams(params)
    return `${this.url}/login/oauth2/auth?${searchParams.toString()}`
  }

  async createTokenForUser (userLoginId: string, canvasCode: string): Promise<boolean> {
    /*
    Make a call to the api with the code and secret
    https://canvas.instructure.com/doc/api/file.oauth_endpoints.html#post-login-oauth2-token
    */

    const params = {
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.secret,
      redirect_uri: this.redirectURI,
      code: canvasCode
      // replace_tokens: true
    }
    const searchParams = new URLSearchParams(params)

    let data
    try {
      const response = await got(`${this.url}/login/oauth2/token`, { searchParams, method: 'POST' })
      // console.log(response)
      data = JSON.parse(response.body)
      logger.debug(JSON.stringify(data, null, 2))
    } catch (error) {
      logger.error(JSON.stringify(error, null, 2))
    }
    if (data === undefined) return false

    // store in new database table
    return true
  }

  // getCanvasToken
  // From the database (either in the User table, or another table connected by FK to User)

  // initiateOAuthFlow
}
