import type { Express, Request, Response } from 'express'
import { BeforeApplicationShutdown, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { IdToken, Provider as LTIProvider } from 'ltijs'
import Database from 'ltijs-sequelize'

import baseLogger from '../logger'
import { DatabaseConfig, LTIConfig } from '../config'
import { UserService } from '../user/user.service'
import { CreateUserDto } from '../user/dto/create-user.dto'

const logger = baseLogger.child({ filePath: __filename })

// ltijs docs: https://cvmcosta.me/ltijs/#/
@Injectable()
export class LTIService implements BeforeApplicationShutdown {
  provider: LTIProvider | undefined

  constructor (private readonly configService: ConfigService, private userService: UserService) {}

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
      logger.debug(JSON.stringify(token))
      const customLTIVariables = token.platformContext.custom
      if(customLTIVariables == null){
        return res.json({'lti_error': 'LTI launch is missing custom attributes, please add it in LTI configutation in Canvas'})
      }
      const user =  new CreateUserDto()
      user.firstName = token.userInfo.given_name
      user.lastName = token.userInfo.family_name
      user.email = token.userInfo.email
      user.loginId = customLTIVariables.login_id as string
      user.ltiId = token.user
      this.userService.upsertUser(user)
      return provider.redirect(res, '/')
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
