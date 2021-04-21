import path from 'path'

import express from 'express'
import type { Express, Request, Response, Router } from 'express'
import { IdToken, Provider } from 'ltijs'
import Database from 'ltijs-sequelize'

import { Config } from './config'
import baseLogger from './logger'

interface EnvOptions {
  isDev: boolean
  staticPath: string
}

const logger = baseLogger.child({ filePath: __filename })

class AppHandler {
  private readonly config: Config
  private readonly apiRouter: Router
  private readonly envOptions: EnvOptions

  constructor (
    config: Config,
    envOptions: EnvOptions,
    apiRouter: Router
  ) {
    this.config = config
    this.envOptions = envOptions
    this.apiRouter = apiRouter
  }

  // ltijs docs: https://cvmcosta.me/ltijs/#/
  async setupLTI (): Promise<Express> {
    const { db, lti } = this.config

    const dbPlugin = new Database(
      db.name,
      db.user,
      db.password,
      { host: db.host, dialect: 'mysql', port: db.port, logging: false }
    )

    const provider = Provider.setup(
      lti.encryptionKey, // Key used to sign cookies and tokens
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

    // Redirect to the application root after a successful launch
    provider.onConnect(async (token: IdToken, req: Request, res: Response) => {
      logger.debug(JSON.stringify(token.userInfo))
      return res.sendFile(path.join(this.envOptions.staticPath, 'index.html'))
    })

    await provider.deploy({ serverless: true })

    await provider.registerPlatform({
      name: lti.platformURL,
      url: lti.platformURL,
      clientId: lti.clientID,
      authenticationEndpoint: lti.platformURL + lti.authEnding,
      accesstokenEndpoint: lti.platformURL + lti.tokenEnding,
      authConfig: {
        method: 'JWK_SET', key: lti.platformURL + lti.keysetEnding
      }
    })
    return provider.app
  }

  async startApp (): Promise<void> {
    const { server } = this.config

    const app = express()

    // Order of middleware matters
    logger.info('Loading client static assets...')
    app.use('/static', express.static(this.envOptions.staticPath))

    logger.info('Adding ltijs as middleware...')
    const ltiApp = await this.setupLTI()
    app.use(ltiApp)

    logger.info('Installing backend API router...')
    app.use('/api', this.apiRouter)

    // Pass requests to other routes to SPA
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(this.envOptions.staticPath, 'index.html'))
    })

    app.listen(server.port, () => {
      logger.info(`Server started on localhost and port ${server.port}`)
    })
  }
}

export default AppHandler
