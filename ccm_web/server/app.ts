import path from 'path'
// import { Sequelize } from 'sequelize';

import AppHandler from './appHandler'
import apiRouter from './apiRouter'
import { validateConfig } from './config'
import baseLogger from './logger'
import {sequelize} from './db/models'

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


// export { Sequelize, sequelize };
// try{
// await sequelize.authenticate()
// console.log('Connection has been established successfully.');
// }catch (error) {
//   console.error('Unable to connect to the database:', error);
// }

// const serverStart = async () => {
//   try{
//     await sequelize.authenticate()
//     console.log('Connection has been established successfully.');
//     }catch (error) {
//       console.error('Unable to connect to the database:', error);
//     }
//     appHandler.startApp()
//     .then(() => logger.info('The application was successfully started.'))
//     .catch(() => logger.error('An error occurred while starting the application.'))

// }
// serverStart()
// try {
//   sequelize.authenticate()
//   logger.info('######## Connection to DB is established ################')
// } catch (error) {
//   logger.error('DB authentiation did not happen ', error)
// }




// TO DO: need to implement database availability check
setTimeout(() => {
  appHandler.startApp()
    .then(() => logger.info('The application was successfully started.'))
    .catch(() => logger.error('An error occurred while starting the application.'))
}, 15000)
