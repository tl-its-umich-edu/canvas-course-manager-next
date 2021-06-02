import got from 'got'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/sequelize'

import { TokenResponseBody } from './canvas.interfaces'
import { CanvasToken } from './canvas.model'
import { privilegeLevelOneScopes } from './canvas.scopes'
import { UserService } from '../user/user.service'

import { CanvasConfig } from '../config'
import baseLogger from '../logger'

const logger = baseLogger.child({ filePath: __filename })

@Injectable()
export class CanvasService {
  clientId: string
  secret: string
  url: string
  redirectURI: string

  constructor (
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    @InjectModel(CanvasToken)
    private readonly canvasTokenModel: typeof CanvasToken
  ) {
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
    Make a call to the Canvas API to create token
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

    const user = await this.userService.findUserByLoginId(userLoginId)
    if (user === null) return false

    let data: TokenResponseBody | undefined
    try {
      const response = await got(`${this.url}/login/oauth2/token`, { searchParams, method: 'POST' })
      data = JSON.parse(response.body)
      logger.debug(JSON.stringify(data, null, 2))
    } catch (error) {
      logger.error(JSON.stringify(error, null, 2))
    }
    if (data === undefined) return false

    // Create CanvasToken instance for user
    let tokenCreated = false
    try {
      await this.canvasTokenModel.create({
        userId: user.id,
        accessToken: data.access_token,
        refreshToken: data.refresh_token
      })
      logger.info(`CanvasToken record successfully created for user ${userLoginId}.`)
      tokenCreated = true
    } catch (error) {
      logger.error(
        'Error occurred while writing Canvas token data to the database: ',
        JSON.stringify(error, null, 2)
      )
    }
    return tokenCreated
  }

  async findToken (userLoginId: string): Promise<CanvasToken | null> {
    const user = await this.userService.findUserByLoginId(userLoginId)
    if (user === null) return null

    const token = user.canvasToken === undefined ? null : user.canvasToken
    return token
  }

  // initiateOAuthFlow
}
