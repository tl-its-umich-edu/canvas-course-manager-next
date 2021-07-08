import baseLogger from './logger'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface ServerConfig {
  port: number
  domain: string
  logLevel: LogLevel
  encryptionSecret: string
}

export interface LTIConfig {
  encryptionKey: string
  clientID: string
  platformURL: string
  authEnding: string
  tokenEnding: string
  keysetEnding: string
}

export interface CanvasConfig {
  instanceURL: string
  apiClientId: string
  apiSecret: string
}

export interface DatabaseConfig {
  host: string
  port: number
  name: string
  user: string
  password: string
}

export interface Config {
  server: ServerConfig
  lti: LTIConfig
  canvas: CanvasConfig
  db: DatabaseConfig
}

const logger = baseLogger.child({ filePath: __filename })

const isString = (v: unknown): v is string => typeof v === 'string'
const isNumber = (v: unknown): v is number => typeof v === 'number' && !isNaN(v)
const isLogLevel = (v: unknown): v is LogLevel => {
  return isString(v) && ['debug', 'info', 'warn', 'error'].includes(v)
}

function validate<T> (
  key: string,
  value: unknown,
  check: (v: unknown) => v is T,
  fallback?: T
): T {
  const errorBase = 'Exception while loading configuration: '
  if (check(value)) return value
  if (fallback !== undefined) {
    logger.info(`Value ${String(value)} for ${key} is invalid; using fallback ${String(fallback)}`)
    return fallback
  }
  throw (Error(errorBase + `Value ${String(value)} for ${key} is not valid`))
}

export function validateConfig (env: Record<string, unknown>): Config {
  let server
  let lti
  let canvas
  let db

  try {
    server = {
      port: validate<number>('PORT', Number(env.PORT), isNumber, 4000),
      domain: validate<string>('DOMAIN', env.DOMAIN, isString),
      logLevel: validate<LogLevel>('LOG_LEVEL', env.LOG_LEVEL, isLogLevel, 'debug'),
      encryptionSecret: validate<string>('ENCRYPTION_SECRET', env.ENCRYPTION_SECRET, isString, 'ENCRYPTIONSECRET')
    }
    lti = {
      encryptionKey: validate<string>('LTI_ENCRYPTION_KEY', env.LTI_ENCRYPTION_KEY, isString, 'LTIKEY'),
      clientID: validate<string>('LTI_CLIENT_ID', env.LTI_CLIENT_ID, isString),
      platformURL: validate<string>('LTI_PLATFORM_URL', env.LTI_PLATFORM_URL, isString),
      authEnding: validate<string>('LTI_AUTH_ENDING', env.LTI_AUTH_ENDING, isString),
      tokenEnding: validate<string>('LTI_TOKEN_ENDING', env.LTI_TOKEN_ENDING, isString),
      keysetEnding: validate<string>('LTI_KEYSET_ENDING', env.LTI_KEYSET_ENDING, isString)
    }
    canvas = {
      instanceURL: validate<string>('CANVAS_INSTANCE_URL', env.CANVAS_INSTANCE_URL, isString),
      apiClientId: validate<string>('CANVAS_API_CLIENT_ID', env.CANVAS_API_CLIENT_ID, isString),
      apiSecret: validate<string>('CANVAS_API_SECRET', env.CANVAS_API_SECRET, isString)
    }
    db = {
      host: validate<string>('DB_HOST', env.DB_HOST, isString),
      port: validate<number>('DB_PORT', Number(env.DB_PORT), isNumber, 3306),
      name: validate<string>('DB_NAME', env.DB_NAME, isString),
      user: validate<string>('DB_USER', env.DB_USER, isString),
      password: validate<string>('DB_PASSWORD', env.DB_PASSWORD, isString)
    }
  } catch (error) {
    logger.error(error)
    throw new Error(error)
  }
  return { server, lti, canvas, db }
}
