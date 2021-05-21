import { Express, Request, Response } from 'express'
import { BeforeApplicationShutdown, HttpStatus, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { IdToken, Provider as LTIProvider } from 'ltijs'
import Database from 'ltijs-sequelize'

import baseLogger from '../logger'
import { DatabaseConfig, LTIConfig } from '../config'
import { UserService } from '../user/user.service'

const logger = baseLogger.child({ filePath: __filename })

// ltijs docs: https://cvmcosta.me/ltijs/#/
@Injectable()
export class LTIService implements BeforeApplicationShutdown {
  provider: LTIProvider | undefined

  constructor (private readonly configService: ConfigService, private readonly userService: UserService) {}

  async setUpLTI (): Promise<void> {
    const dbConfig = this.configService.get('db') as DatabaseConfig
    const ltiConfig = this.configService.get('lti') as LTIConfig

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
        appRoute: '/lti',
        loginRoute: '/lti/login',
        keysetRoute: '/lti/keys',
        // Set secure to true if the testing platform is in a different domain and https is being used
        // Set sameSite to 'None' if the testing platform is in a different domain and https is being used
        cookies: { secure: true, sameSite: 'None' }
      }
    )

    // Redirect to the application root after a successful launch
    provider.onConnect(async (token: IdToken, req: Request, res: Response) => {
      logger.debug(`The LTI launch was successful! User info: ${JSON.stringify(token.userInfo)}`)
      const customLTIVariables = token.platformContext.custom
      if (customLTIVariables?.login_id === undefined) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ lti_error: 'LTI launch is missing custom attributes, please add it in LTI configutation in Canvas' })
      }
      const loginId = customLTIVariables.login_id as string
      try {
        const [record, created] = await this.userService.upsertUser({
          firstName: token.userInfo.given_name,
          lastName: token.userInfo.family_name,
          email: token.userInfo.email,
          loginId: loginId
        })

        /* created variable will return non null value for Mysql, but the Return type on upsert method is Promise<[User, boolean|null] >
      so Typescript is mandating a null check. So here the null is changed to false to escape the type validation errors */
        logger.info(
          `User ${record.loginId} is ${
            (created ?? false) ? 'created' : 'updated'
          } in 'user' table`
        )
        return provider.redirect(res, '/')
      } catch (e) {
        logger.error(`something went wrong in creating user: ${loginId} with error ${String(e.name)} due to ${String(e.message)}`)
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json('The Launch of application failed, please try to refresh the page.')
      }
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
