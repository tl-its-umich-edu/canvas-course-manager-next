import { Sequelize } from 'sequelize'
import baseLogger from './../../logger'
const logger = baseLogger.child({ filePath: __filename })

const { NODE_ENV } = process.env
const dbconfig = require('./../config/dbconfig.js')

const config = NODE_ENV != null ? dbconfig[NODE_ENV] : dbconfig['development']

const sequelize = new Sequelize(config.database, config.username, config.password, {
  dialect: config.dialect,
  host: config.host,
  logging: logger.debug.bind(logger),
})

export { Sequelize, sequelize }
