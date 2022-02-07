import baseLogger from './logger'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface ServerConfig {
  isDev: boolean
  port: number
  domain: string
  frameDomain: string
  logLevel: LogLevel
  cookieSecret: string
  tokenSecret: string
  maxAgeInSec: number
}

interface LTIConfig {
  encryptionKey: string
  clientID: string
  platformURL: string
  authEnding: string
  tokenEnding: string
  keysetEnding: string
}

interface CanvasConfig {
  instanceURL: string
  apiClientId: string
  apiSecret: string
  customRoles: string
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
  baseHelpURL: string
}

const logger = baseLogger.child({ filePath: __filename })

const isString = (v: unknown): v is string => typeof v === 'string'
const isNotEmpty = (v: string): boolean => v.length > 0

const isNumber = (v: unknown): v is number => typeof v === 'number'
const isNotNan = (v: number): boolean => !isNaN(v)

// Tests if an unknown value is one of four allowed string log levels
const isLogLevel = (v: unknown): v is LogLevel => {
  return isString(v) && ['debug', 'info', 'warn', 'error'].includes(v)
}

// Handles some edge cases and casts all other values using Number
const prepNumber = (value: string | undefined): string | number | undefined => {
  return (value === undefined) ? undefined : value.trim() === '' ? value : Number(value)
}

function validate<T> (
  key: string,
  value: unknown,
  checkType: (v: unknown) => v is T,
  extraChecks: Array<(v: T) => boolean>,
  fallback?: T
): T {
  const errorBase = 'Exception while loading configuration: '
  const runExtraChecks = (v: T): boolean => extraChecks.map(c => c(v)).every(r => r)
  if (value === undefined && fallback !== undefined) {
    const fallbackBase = `Value for ${key} was undefined; `
    if (extraChecks.length > 0) {
      if (!runExtraChecks(fallback)) {
        throw new Error(errorBase + fallbackBase + `fallback "${String(fallback)}" did not pass extra checks.`)
      }
    }
    logger.info(fallbackBase + `using fallback ${String(fallback)}`)
    return fallback
  }
  if (checkType(value)) {
    if (extraChecks.length === 0) return value
    if (runExtraChecks(value)) return value
  }
  throw new Error(errorBase + `Value "${String(value)}" for ${key} is not valid`)
}

export function validateConfig (): Config {
  const { env } = process

  let server
  let lti
  let canvas
  let db
  let baseHelpURL

  try {
    server = {
      isDev: env.NODE_ENV !== 'production',
      port: validate<number>('PORT', prepNumber(env.PORT), isNumber, [isNotNan], 4000),
      domain: validate<string>('DOMAIN', env.DOMAIN, isString, [isNotEmpty]),
      frameDomain: validate<string>('FRAME_DOMAIN', env.FRAME_DOMAIN, isString, [isNotEmpty]),
      logLevel: validate<LogLevel>('LOG_LEVEL', env.LOG_LEVEL, isLogLevel, [], 'debug'),
      tokenSecret: validate<string>('TOKEN_SECRET', env.TOKEN_SECRET, isString, [isNotEmpty], 'TOKENSECRET'),
      cookieSecret: validate<string>('COOKIE_SECRET', env.COOKIE_SECRET, isString, [isNotEmpty], 'COOKIESECRET'),
      maxAgeInSec: validate<number>('MAX_AGE_IN_SEC', prepNumber(env.MAX_AGE_IN_SEC), isNumber, [isNotNan], (24 * 60 * 60))
    }
    lti = {
      encryptionKey: validate<string>('LTI_ENCRYPTION_KEY', env.LTI_ENCRYPTION_KEY, isString, [isNotEmpty], 'LTIKEY'),
      clientID: validate<string>('LTI_CLIENT_ID', env.LTI_CLIENT_ID, isString, [isNotEmpty]),
      platformURL: validate<string>('LTI_PLATFORM_URL', env.LTI_PLATFORM_URL, isString, [isNotEmpty]),
      authEnding: validate<string>('LTI_AUTH_ENDING', env.LTI_AUTH_ENDING, isString, [isNotEmpty]),
      tokenEnding: validate<string>('LTI_TOKEN_ENDING', env.LTI_TOKEN_ENDING, isString, [isNotEmpty]),
      keysetEnding: validate<string>('LTI_KEYSET_ENDING', env.LTI_KEYSET_ENDING, isString, [isNotEmpty])
    }
    canvas = {
      instanceURL: validate<string>('CANVAS_INSTANCE_URL', env.CANVAS_INSTANCE_URL, isString, [isNotEmpty]),
      apiClientId: validate<string>('CANVAS_API_CLIENT_ID', env.CANVAS_API_CLIENT_ID, isString, [isNotEmpty]),
      apiSecret: validate<string>('CANVAS_API_SECRET', env.CANVAS_API_SECRET, isString, [isNotEmpty]),
      customRoles: validate<string>('CANVAS_CUSTOM_ROLES', env.CANVAS_CUSTOM_ROLES, isString, [isNotEmpty])
    }
    db = {
      host: validate<string>('DB_HOST', env.DB_HOST, isString, [isNotEmpty]),
      port: validate<number>('DB_PORT', prepNumber(env.DB_PORT), isNumber, [isNotNan], 3306),
      name: validate<string>('DB_NAME', env.DB_NAME, isString, [isNotEmpty]),
      user: validate<string>('DB_USER', env.DB_USER, isString, [isNotEmpty]),
      password: validate<string>('DB_PASSWORD', env.DB_PASSWORD, isString, [isNotEmpty])
    }
    baseHelpURL = validate<string>('HELP_URL', env.HELP_URL, isString, [isNotEmpty], 'http://localhost:4020')
  } catch (error) {
    logger.error(error)
    throw new Error(String(error))
  }
  return { server, lti, canvas, db, baseHelpURL }
}
