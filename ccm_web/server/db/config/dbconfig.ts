interface IDatabaseConfig {
  username: string
  password: string
  database: string
  host: string
  port: number
  dialect: string
}
export const databaseConfig: IDatabaseConfig = {
  username: process.env.DB_USER || "admin",
  password: process.env.DB_PASSWORD || "admin",
  database: process.env.DB_NAME || "ccm",
  host: process.env.DB_HOST || "ccm_db",
  port: Number(process.env.DB_PORT) || 3360,
  dialect: "mysql",
};
