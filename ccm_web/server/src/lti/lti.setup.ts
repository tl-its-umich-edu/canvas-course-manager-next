import type { Express, Request, Response } from 'express'
import { IdToken, Provider as LTIProvider } from 'ltijs'
import Database from 'ltijs-sequelize'

import baseLogger from '../logger'
import { DatabaseConfig, LTIConfig } from '../config'

const logger = baseLogger.child({ filePath: __filename })

// ltijs docs: https://cvmcosta.me/ltijs/#/
async function setUpLTI (dbConfig: DatabaseConfig, ltiConfig: LTIConfig): Promise<Express> {
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
    logger.info(JSON.stringify(token.userInfo))
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
  return provider.app
}

export default setUpLTI
