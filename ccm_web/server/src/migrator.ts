import { Umzug, SequelizeStorage } from 'umzug'
import { Sequelize } from 'sequelize'
import { validateConfig } from './config'
import baseLogger from './logger'

const logger = baseLogger.child({ filePath: __filename })

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

if (require.main === module) {
  logger.info('Running migrations CLI...')
  umzug
    .runAsCLI()
    .then(() => logger.info('Migration tasks ran!'))
    .catch((e) =>
      logger.error('An error occured when running the migration tasks: ', e)
    )
}
