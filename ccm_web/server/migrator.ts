import { Umzug, SequelizeStorage } from "umzug"
import { Sequelize } from "sequelize"
import { validateConfig } from "./src/config"
import baseLogger from "./src/logger"
import fs from 'fs'
import path from 'path'
const logger = baseLogger.child({ filePath: __filename })

const databaseConfig = validateConfig(process.env).db
logger.info(`DB Config: ${JSON.stringify(databaseConfig)}`)

const sequelize = new Sequelize(
  databaseConfig.name,
  databaseConfig.user,
  databaseConfig.password,
  {
    dialect: "mysql",
    host: databaseConfig.host,
  }
)

export const umzug = new Umzug({
  migrations: {
    glob: ["migrations/*.{js,ts}", { cwd: __dirname }],
    resolve: (params) => {
      return Umzug.defaultResolver(params);
    },
  },
  context: sequelize,
  storage: new SequelizeStorage({ sequelize }),
  logger: logger
})

export type Migration = typeof umzug._types.migration;

if (require.main === module) {
  logger.info("Running migrations CLI ....");
  umzug.runAsCLI();
}
