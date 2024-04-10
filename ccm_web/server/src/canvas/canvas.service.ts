import axios from 'axios'
import got, { Options as GotOptions } from 'got'
import { lastValueFrom } from 'rxjs'
import CanvasRequestor from '@kth/canvas-api'
import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/sequelize'

import { CanvasOAuthAPIError, CanvasTokenNotFoundError, InvalidTokenRefreshError } from './canvas.errors.js'
import { TokenCodeResponseBody, TokenRefreshResponseBody } from './canvas.interfaces.js'
import { CanvasToken } from './canvas.model.js'
import canvasScopes from './canvas.scopes.js'
import { User } from '../user/user.model.js'

import { Config } from '../config.js'
import { DatabaseError } from '../errors.js'
import baseLogger from '../logger.js'

const logger = baseLogger.child({ filePath: import.meta.filename })

type SupportedAPIEndpoint = '/api/v1/' | '/api/graphql/'

const { default: CanvasAPI } = CanvasRequestor as any

const requestorOptions: Partial<GotOptions> = {
  retry: {
    limit: 3,
    methods: ['POST', 'GET', 'PUT', 'DELETE'],
    statusCodes: got.defaults.options.retry?.statusCodes?.concat([403]) ?? [403],
    calculateDelay: ({ attemptCount, retryOptions, error, computedValue }) => {
      const delay = computedValue === 0 ? 0 : 2000

      let logMessage =
        `calculateDelay [${String(attemptCount)}] — ` +
        `"delay": "${String(delay)}"; ` +
        `"retryOptions": "${JSON.stringify(retryOptions)}"; ` +
        `"error.code": ${String(error.code)}`

      const headers = error.response?.headers
      if (headers !== undefined) {
        logMessage +=
          `"x-rate-limit-remaining": "${String(headers['x-rate-limit-remaining'])}"; ` +
          `"x-request-cost": "${String(headers['x-request-cost'])}"; `
      } else {
        logMessage += 'headers not available'
      }

      logger.debug(logMessage)

      return delay
    }
  },
  hooks: {
    init: [],
    beforeRequest: [],
    beforeRedirect: [],
    beforeError: [],
    afterResponse: [(response, retryWithMergedOptions) => {
      let logMessage = 'afterResponse — '

      const headers = response.headers
      if (headers !== undefined) {
        logMessage += `"x-rate-limit-remaining": "${String(headers['x-rate-limit-remaining'])}"; ` +
          `"x-request-cost": "${String(headers['x-request-cost'])}"`
      } else {
        logMessage += 'headers not available'
      }

      logger.debug(logMessage)

      return response
    }],
    beforeRetry: [(error, retryCount) => {
      logger.debug(`beforeRetry [${String(retryCount)}] - ` +
        `"error.response.statusCode": "${String(error?.response?.statusCode)}"; ` +
        `"error.code": "${String(error?.code)}"`)
    }]
  }
}

@Injectable()
export class CanvasService {
  clientId: string
  secret: string
  adminToken: string
  newUserAccountID: number
  url: string
  redirectURI: string

  constructor (
    private readonly configService: ConfigService<Config, true>,
    private readonly httpService: HttpService,
    @InjectModel(CanvasToken)
    private readonly canvasTokenModel: typeof CanvasToken
  ) {
    const canvasConfig = configService.get('canvas', { infer: true })
    const domain = configService.get('server.domain', { infer: true })
    this.clientId = canvasConfig.apiClientId
    this.secret = canvasConfig.apiSecret
    this.adminToken = canvasConfig.adminApiToken
    this.newUserAccountID = canvasConfig.newUserAccountID
    this.url = canvasConfig.instanceURL
    this.redirectURI = `https://${domain}/canvas/returnFromOAuth`
  }

  getAuthURL (): string {
    const params = {
      client_id: this.clientId,
      response_type: 'code',
      scope: canvasScopes.join(' '),
      redirect_uri: this.redirectURI
    }
    const searchParams = new URLSearchParams(params)
    return `${this.url}/login/oauth2/auth?${searchParams.toString()}`
  }

  static calculateExpiresAt (time: Date, expiresIn: number): Date {
    // Use 95 percent of expiration period to guarantee expired tokens aren't used
    const msTilExpire = expiresIn * 1000 * 0.95
    logger.debug(`Milliseconds until token should be treated as expired: ${msTilExpire}`)
    const expiresAt = new Date(time.getTime() + msTilExpire)
    logger.debug(`Treat token as expired at ${expiresAt.toISOString()}`)
    return expiresAt
  }

  async createTokenForUser (user: User, canvasCode: string): Promise<void> {
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
    }

    let data: TokenCodeResponseBody | undefined
    const timeOfRequest = new Date()

    try {
      const response = await lastValueFrom(this.httpService.post<TokenCodeResponseBody>(
        `${this.url}/login/oauth2/token`, params
      ))
      logger.debug(`Status code: ${response.status}`)
      data = response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response !== undefined) {
        logger.error(`Received unusual status code ${error.response.status}`)
        logger.error(`Response body: ${JSON.stringify(error.response.data, null, 2)}`)
      } else {
        logger.error(
          `Error occurred while making request to Canvas for access token: ${JSON.stringify(error, null, 2)}`
        )
      }
      throw new CanvasOAuthAPIError()
    }

    // Create CanvasToken instance for user
    const expiresAt = CanvasService.calculateExpiresAt(timeOfRequest, data.expires_in)
    try {
      await this.canvasTokenModel.create({
        userId: user.id,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: expiresAt.toISOString()
      })
      logger.info(`CanvasToken record successfully created for user ${user.loginId}.`)
    } catch (error) {
      logger.error(
        `Error occurred while writing Canvas token data to the database: ${JSON.stringify(error, null, 2)}`
      )
      throw new DatabaseError()
    }
  }

  async deleteTokenForUser (user: User): Promise<void> {
    if (user.canvasToken === null) throw new CanvasTokenNotFoundError(user.loginId)

    logger.info(`Removing token for ${user.loginId}...`)
    try {
      await user.canvasToken.destroy()
    } catch (error) {
      logger.error(
        `Error occurred while destroying CanvasToken for ${user.loginId}: ${JSON.stringify(error, null, 2)}`
      )
      throw new DatabaseError()
    }
  }

  async refreshToken (token: CanvasToken): Promise<CanvasToken> {
    const params = {
      grant_type: 'refresh_token',
      client_id: this.clientId,
      client_secret: this.secret,
      refresh_token: token.refreshToken
    }

    let data: TokenRefreshResponseBody | undefined
    const timeOfRequest = new Date()

    try {
      const response = await lastValueFrom(this.httpService.post<TokenRefreshResponseBody>(
        `${this.url}/login/oauth2/token`, params
      ))
      logger.debug(`Status code: ${response.status}`)
      data = response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response !== undefined) {
        const { status, data } = error.response
        logger.warn(
          `Error occurred during refresh. Status code: ${status}; response body: ${JSON.stringify(data, null, 2)}`
        )
        logger.warn('Existing token is now likely invalid.')
        throw new InvalidTokenRefreshError()
      } else {
        logger.error(
          `Error occurred while making request to Canvas for access token: ${JSON.stringify(error, null, 2)}`
        )
      }
      throw new CanvasOAuthAPIError()
    }

    token.accessToken = data.access_token
    const expiresAt = CanvasService.calculateExpiresAt(timeOfRequest, data.expires_in)
    token.expiresAt = expiresAt.toISOString()
    try {
      await token.save()
      return token
    } catch (error) {
      logger.error(
        `Error occurred while saving CanvasToken with new accessToken: ${JSON.stringify(error, null, 2)}`
      )
      throw new DatabaseError()
    }
  }

  async createRequestorForUser (user: User, endpoint: SupportedAPIEndpoint): Promise<CanvasRequestor> {
    if (user.canvasToken === null) throw new CanvasTokenNotFoundError(user.loginId)

    let token = user.canvasToken
    const tokenExpired = token.isExpired()
    if (tokenExpired) {
      logger.debug('Token for user has expired; refreshing token...')
      token = await this.refreshToken(token)
    }
    const requestor = new CanvasAPI(this.url + endpoint, token.accessToken, requestorOptions)
    return requestor
  }
  
  createRequestorForAdmin (endpoint: SupportedAPIEndpoint): CanvasRequestor {
    const requestor = new CanvasAPI(this.url + endpoint, this.adminToken, requestorOptions)
    return requestor
  }
}
