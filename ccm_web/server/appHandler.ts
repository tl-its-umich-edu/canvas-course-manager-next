import path from 'path'

import { NextHandleFunction } from 'connect'
import express from 'express'
import type { Express, Request, Response, Router } from 'express'
import { Provider } from 'ltijs'
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

// TO DO: handle configured host name for prod
class AppHandler {
  private readonly config: Config
  private readonly apiRouter: Router
  private readonly useLTI: boolean
  private readonly envOptions: DevOptions | ProdOptions

  constructor (
    config: Config,
    useLTI: boolean,
    envOptions: DevOptions | ProdOptions,
    apiRouter: Router
  ) {
    this.config = config
    this.useLTI = useLTI
    this.envOptions = envOptions
    this.apiRouter = apiRouter
  }

  static handleProdClient (app: Express, staticPath: string): void {
    console.log('Loading dist/client...')
    app.use(express.static(staticPath))

    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(staticPath, 'index.html'))
    })
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

  // LTIJS docs: https://cvmcosta.me/ltijs/#/
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
    provider.onConnect((token: any, req: Request, res: Response) => {
      if (!this.envOptions.isDev) {
        return res.sendFile(path.join(this.envOptions.staticPath, 'index.html'))
      }
      return provider.redirect(res, '/')
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

  // Configure and start LTI app or plain Express app instance
  startApp (): void {
    if (this.useLTI) {
      console.log('Starting LTIJS server...')
      this.setupLTI()
        .then(() => console.log('LTI application setup has completed.'))
        .catch((r) => {
          throw Error(`LTI code failed to initialize app: ${String(r)}`)
        })
    } else {
      console.log('Starting plain Express server...')
      const app = express()
      app.use('/api', this.apiRouter)

      if (this.envOptions.isDev) {
        app.use(AppHandler.setupWebpackMiddleware().middleware)
      } else {
        AppHandler.handleProdClient(app, this.envOptions.staticPath)
      }

      const { server } = this.config
      app.listen(server.port, server.host, () => {
        console.log(`Server started on ${server.host} and port ${server.port}`)
      })
    }
  }
}

export default AppHandler
