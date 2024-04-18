import { fileURLToPath } from 'node:url'
import process from 'node:process'
import { Umzug, SequelizeStorage } from 'umzug'
import { Sequelize } from 'sequelize'
import { validateConfig } from './config.js'
import baseLogger from './logger.js'

const __dirname = import.meta.dirname
const logger = baseLogger.child({ filePath: import.meta.filename })

const databaseConfig = validateConfig().db

const sequelize = new Sequelize(
  databaseConfig.name,
  databaseConfig.user,
  databaseConfig.password,
  {
    dialect: 'mysql',
    host: databaseConfig.host
  }
)

export const umzug = new Umzug({
  migrations: {
    glob: ['migrations/*.{js,ts}', { cwd: __dirname }],
    resolve: (params) => {
      return Umzug.defaultResolver(params)
    }
  },
  context: sequelize,
  storage: new SequelizeStorage({ sequelize, tableName: 'ccm_sequelize_meta' }),
  logger: logger
})

export type Migration = typeof umzug._types.migration

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  logger.info('Running migrations CLI...')
  umzug
    .runAsCLI()
    .then(() => logger.info('Migration tasks ran!'))
    .catch((e) =>
      logger.error('An error occured when running the migration tasks: ', e)
    )
}else{
  logger.error('Running migrations failed...')
}
