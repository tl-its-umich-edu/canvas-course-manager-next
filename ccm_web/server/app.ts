import path from 'path'

import AppHandler from './appHandler'
import apiRouter from './apiRouter'
import { validateConfig } from './config'

const { NODE_ENV } = process.env

const config = validateConfig(process.env)
if (config === undefined) process.exit(1)

const isDev = NODE_ENV !== 'production'

const envOptions = isDev
  ? { isDev, staticPath: path.join(__dirname, '..', 'dist', 'client') }
  : { isDev, staticPath: path.join(__dirname, '..', 'client') }

const appHandler = new AppHandler(config, envOptions, apiRouter)

// TO DO: need to implement database availability check
setTimeout(() => appHandler.startApp(), 15000)
