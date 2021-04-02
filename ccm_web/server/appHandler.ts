import path from 'path'

import { NextHandleFunction } from 'connect'
import express from 'express'
import type { Express, Request, Response, Router } from 'express'
import { IdToken, Provider } from 'ltijs'
import Database from 'ltijs-sequelize'
import webpack from 'webpack'
import webpackDevMiddleware from 'webpack-dev-middleware'
import type { WebpackDevMiddleware } from 'webpack-dev-middleware'

import { Config } from './config'
import devWebpackConfig from '../webpack/webpack.dev'

interface DevOptions {
  isDev: true
}

interface ProdOptions {
  isDev: false
  staticPath: string
}

interface WebpackDevOutput {
  middleware: WebpackDevMiddleware & NextHandleFunction
  publicPath: string
}

class AppHandler {
  private readonly config: Config
  private readonly apiRouter: Router
  private readonly envOptions: DevOptions | ProdOptions

  constructor (
    config: Config,
    envOptions: DevOptions | ProdOptions,
    apiRouter: Router
  ) {
    this.config = config
    this.envOptions = envOptions
    this.apiRouter = apiRouter
  }

  /* TO DO: Investigate some way to dynamically import webpack stuff? */
  static setupWebpackMiddleware (): WebpackDevOutput {
    console.log('Setting up webpack-dev-middleware...')

    const publicPath = devWebpackConfig.output?.publicPath
    if (publicPath === undefined) throw Error('Webpack publicPath was not properly defined!')

    const compiler = webpack(devWebpackConfig)
    const webpackDevMid = webpackDevMiddleware(compiler, {
      publicPath: String(publicPath),
      // Just copies what's used in memory to client/build (changing doesn't do anything)
      writeToDisk: true
    })
    return { middleware: webpackDevMid, publicPath: String(publicPath) }
  }

  // ltijs docs: https://cvmcosta.me/ltijs/#/
  async setupLTI (): Promise<Express> {
    const { server, db, lti } = this.config

    const dbPlugin = new Database(
      db.name,
      db.user,
      db.password,
      { host: db.host, dialect: 'postgres', logging: false }
    )

    let serverAddon
    let staticPath
    if (this.envOptions.isDev) {
      const output = AppHandler.setupWebpackMiddleware()
      serverAddon = (app: Express) => app.use(output.middleware)
      staticPath = output.publicPath
    } else {
      staticPath = this.envOptions.staticPath
    }

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
        cookies: {
          secure: true,
          sameSite: 'None'
        },
        serverAddon: serverAddon,
        staticPath: staticPath
      }
    )

    provider.app.use('/api', this.apiRouter)

    // Set lti launch callback
    // When receiving successful LTI launch redirects to app.
    provider.onConnect(async (token: IdToken, req: Request, res: Response) => {
      if (!this.envOptions.isDev) {
        return res.sendFile(path.join(this.envOptions.staticPath, 'index.html'))
      }
      provider.redirect(res, '/')
    })

    await provider.deploy({ port: server.port })

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

  startApp (): void {
    console.log('Starting ltijs server...')
    this.setupLTI()
      .then(() => console.log('LTI application setup has completed.'))
      .catch((r) => {
        throw Error(`LTI code failed to initialize app: ${String(r)}`)
      })
  }
}

export default AppHandler
