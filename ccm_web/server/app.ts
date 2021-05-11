import path from 'path'

import AppHandler from './appHandler'
import apiRouter from './apiRouter'
import { validateConfig } from './config'
import baseLogger from './logger'

const { NODE_ENV } = process.env

const config = validateConfig(process.env)
if (config === undefined) process.exit(1)

baseLogger.level = config.server.logLevel
const logger = baseLogger.child({ filePath: __filename })

const isDev = NODE_ENV !== 'production'

const envOptions = isDev
  ? { isDev, staticPath: path.join(__dirname, '..', 'dist', 'client') }
  : { isDev, staticPath: path.join(__dirname, '..', 'client') }

const appHandler = new AppHandler(config, envOptions, apiRouter)

// TO DO: need to implement database availability check
setTimeout(() => {
  appHandler.startApp()
    .then(() => logger.info('The application was successfully started.'))
    .catch((error) => logger.error('An error occurred while starting the application.', error))
}, 15000)
