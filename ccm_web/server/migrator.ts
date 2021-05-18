import { Umzug, SequelizeStorage } from "umzug"
import { Sequelize } from "sequelize"
import { databaseConfig } from "./db/config/dbconfig"
import baseLogger from "./src/logger"
const logger = baseLogger.child({ filePath: __filename })
import { readFileSync } from 'fs'
import path from 'path'

const sequelize = new Sequelize(
  databaseConfig.database,
  databaseConfig.username,
  databaseConfig.password,
  {
    dialect: "mysql",
    host: databaseConfig.host,
  }
);

export const umzug = new Umzug({
  migrations: {
    glob: ["migrations/*.{js,ts}", { cwd: __dirname }],
    resolve: (params) => {
      return Umzug.defaultResolver(params);
    },
  },
  context: sequelize,
  storage: new SequelizeStorage({ sequelize }),
  logger: logger,
});

export type Migration = typeof umzug._types.migration;

if (require.main === module) {
  logger.info("Running the migrations....");
  umzug.runAsCLI();
}
