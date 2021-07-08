import { Express, Request, Response } from 'express'
import { BeforeApplicationShutdown, HttpStatus, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { IdToken, Provider as LTIProvider } from 'ltijs'
import Database from 'ltijs-sequelize'

import { AuthService } from '../auth/auth.service'
import { AccessToken } from '../auth/auth.interfaces'

import baseLogger from '../logger'
import { DatabaseConfig, LTIConfig, ServerConfig } from '../config'

const logger = baseLogger.child({ filePath: __filename })

const createLaunchErrorResponse = (res: Response, action?: string): Response => {
  const message = (
    'The launch of the application failed; ' +
    (action !== undefined ? action : 'please try to refresh the page or contact support.')
  )
  return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(message)
}

// ltijs docs: https://cvmcosta.me/ltijs/#/
@Injectable()
export class LTIService implements BeforeApplicationShutdown {
  provider: LTIProvider | undefined

  constructor (private readonly configService: ConfigService, private readonly authService: AuthService) {}

  async setUpLTI (): Promise<void> {
    const dbConfig = this.configService.get('db') as DatabaseConfig
    const ltiConfig = this.configService.get('lti') as LTIConfig
    const serverConfig = this.configService.get('server') as ServerConfig

    logger.info('Initializng ltijs as middleware')

    const dbPlugin = new Database(
      dbConfig.name,
      dbConfig.user,
      dbConfig.password,
      { host: dbConfig.host, dialect: 'mysql', port: dbConfig.port, logging: false }
    )

    const provider = LTIProvider.setup(
      ltiConfig.encryptionKey, // Key used to sign cookies and tokens
      { plugin: dbPlugin },
      {
        // Reserved routes
        appRoute: '/',
        loginRoute: '/login',
        keysetRoute: '/keys',
        // Set secure to true if the testing platform is in a different domain and https is being used
        // Set sameSite to 'None' if the testing platform is in a different domain and https is being used
        cookies: { secure: true, sameSite: 'None' }
      }
    )

    // Redirect to the Canvas token check and OAuth workflow after a successful launch
    provider.onConnect(async (token: IdToken, req: Request, res: Response) => {
      logger.debug(`The LTI launch was successful! User info: ${JSON.stringify(token.userInfo)}`)
      const customLTIVariables = token.platformContext.custom
      if (customLTIVariables.login_id === undefined || customLTIVariables.course_id === undefined ||
        customLTIVariables.roles === undefined || customLTIVariables.is_root_account_admin === undefined) {
        return createLaunchErrorResponse(res, 'please check the LTI configuration in Canvas.')
      }
      const loginId = customLTIVariables.login_id as string
      const courseId = customLTIVariables.course_id as number
      const roles = customLTIVariables.roles as string
      const isRootAdmin = customLTIVariables.is_root_account_admin as boolean

      let jwtToken: AccessToken
      try {
        jwtToken = await this.authService.loginLTI({
          firstName: token.userInfo.given_name,
          lastName: token.userInfo.family_name,
          email: token.userInfo.email,
          loginId: loginId
        })
      } catch (e) {
        logger.error(`Something went wrong while creating user with loginId ${loginId}; error ${String(e.name)} due to ${String(e.message)}`)
        return createLaunchErrorResponse(res)
      }
      // More data will be added to the session here later
      const course = {
        id: courseId,
        roles: (roles.length > 0) ? roles.split(',') : [] // role won't be empty but adding a validation for safety
      }
      const sessionData = {
        userLoginId: loginId,
        course: course,
        isRootAdmin: isRootAdmin
      }
      req.session.data = sessionData
      req.session.save((err) => {
        if (err !== null) {
          logger.error('Failed to save session data due to error: ', err)
          return createLaunchErrorResponse(res)
        }
        res.cookie('jwt', jwtToken.access_token, {
          httpOnly: true, secure: true, domain: serverConfig.domain, sameSite: 'none', signed: true
        })
        return res.redirect('/canvas/redirectOAuth')
      })
    })

    await provider.deploy({ serverless: true })

    await provider.registerPlatform({
      name: ltiConfig.platformURL,
      url: ltiConfig.platformURL,
      clientId: ltiConfig.clientID,
      authenticationEndpoint: ltiConfig.platformURL + ltiConfig.authEnding,
      accesstokenEndpoint: ltiConfig.platformURL + ltiConfig.tokenEnding,
      authConfig: {
        method: 'JWK_SET', key: ltiConfig.platformURL + ltiConfig.keysetEnding
      }
    })

    this.provider = provider
  }

  getMiddleware (): Express | undefined {
    return this.provider?.app
  }

  beforeApplicationShutdown (): void {
    this.provider?.close()
  }
}
