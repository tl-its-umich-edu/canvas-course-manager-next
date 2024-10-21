import baseLogger from './logger.js'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface ServerConfig {
  isDev: boolean
  port: number
  domain: string
  frameDomain: string
  logLevel: LogLevel
  cookieSecret: string
  tokenSecret: string
  csrfSecret: string
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

export interface CustomCanvasRoleData {
  [role: string]: number
}

interface CanvasConfig {
  instanceURL: string
  apiClientId: string
  apiSecret: string
  adminApiToken: string
  newUserAccountID: number
  customCanvasRoleData: CustomCanvasRoleData
  maxSearchCourses: number
}

export interface InvitationConfig {
  apiURL: string
  apiKey: string
  apiSecret: string
  apiEntityID: string
  apiSponsorName: string
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
  invitation: InvitationConfig
  db: DatabaseConfig
  baseHelpURL: string
}

const logger = baseLogger.child({ filePath: import.meta.filename })

const isString = (v: unknown): v is string => typeof v === 'string'
const isNotEmpty = (v: string): boolean => v.length > 0

const isNumber = (v: unknown): v is number => typeof v === 'number'
const isNotNan = (v: number): boolean => !isNaN(v)
const isInteger = (v: number): boolean => Number.isInteger(v)

// Tests if an unknown value is one of four allowed string log levels
const isLogLevel = (v: unknown): v is LogLevel => {
  return isString(v) && ['debug', 'info', 'warn', 'error'].includes(v)
}
const isCustomCanvasRoles = (v: unknown): v is CustomCanvasRoleData => {
  if (typeof v === 'object' && v !== null) {
    for (const [key, value] of Object.entries(v)) {
      if (!(isNumber(value) && isNotNan(value) && isInteger(value))) return false
      if (!isString(key)) return false
    }
    return true
  } else {
    return false // undefined or not an object
  }
}
const errorBase = 'Exception while loading configuration: '

// Handles some edge cases and casts all other values using Number
const prepNumber = (value: string | undefined): string | number | undefined => {
  return (value === undefined) ? undefined : value.trim() === '' ? value : Number(value)
}

const prepObjectFromJSON = (value: string | undefined): Record<string, unknown> | undefined => {
  if (value === undefined) return undefined
  try {
    return JSON.parse(value)
  } catch (error) {
    throw new Error(errorBase + 'a provided JSON value was found to be invalid.')
  }
}

function validate<T> (
  key: string,
  value: unknown,
  checkType: (v: unknown) => v is T,
  extraChecks: Array<(v: T) => boolean>,
  fallback?: T
): T {
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
  let invitation
  let db
  let baseHelpURL

  try {
    server = {
      isDev: env.NODE_ENV !== 'production',
      port: validate<number>('PORT', prepNumber(env.PORT), isNumber, [isNotNan, isInteger], 4000),
      domain: validate<string>('DOMAIN', env.DOMAIN, isString, [isNotEmpty]),
      frameDomain: validate<string>('FRAME_DOMAIN', env.FRAME_DOMAIN, isString, [isNotEmpty]),
      logLevel: validate<LogLevel>('LOG_LEVEL', env.LOG_LEVEL, isLogLevel, [], 'debug'),
      tokenSecret: validate<string>('TOKEN_SECRET', env.TOKEN_SECRET, isString, [isNotEmpty], 'TOKENSECRET'),
      cookieSecret: validate<string>('COOKIE_SECRET', env.COOKIE_SECRET, isString, [isNotEmpty], 'COOKIESECRET'),
      csrfSecret: validate<string>('CSRF_SECRET', env.COOKIE_SECRET, isString, [isNotEmpty], 'CSRFSECRET'),
      maxAgeInSec: validate<number>(
        'MAX_AGE_IN_SEC', prepNumber(env.MAX_AGE_IN_SEC), isNumber, [isNotNan, isInteger], (24 * 60 * 60)
      )
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
      adminApiToken: validate<string>('CANVAS_ADMIN_API_TOKEN', env.CANVAS_ADMIN_API_TOKEN, isString, [isNotEmpty]),
      newUserAccountID: validate<number>(
        'CANVAS_NEW_USER_ACCOUNT_ID', prepNumber(env.CANVAS_NEW_USER_ACCOUNT_ID), isNumber, [isNotNan, isInteger], 1
      ),
      customCanvasRoleData: validate<CustomCanvasRoleData>(
        'CANVAS_CUSTOM_ROLES', prepObjectFromJSON(env.CANVAS_CUSTOM_ROLES), isCustomCanvasRoles, [], { Assistant: 34, Librarian: 21 }
      ),
      maxSearchCourses: validate<number>(
        'CANVAS_MAX_SEARCH_COURSES', prepNumber(env.CANVAS_MAX_SEARCH_COURSES), isNumber, [isNotNan, isInteger], 400
      )
    }
    invitation = {
      apiURL: validate<string>('INVITATION_API_URL', env.INVITATION_API_URL, isString, [isNotEmpty]),
      apiKey: validate<string>('INVITATION_API_KEY', env.INVITATION_API_KEY, isString, [isNotEmpty]),
      apiSecret: validate<string>('INVITATION_API_SECRET', env.INVITATION_API_SECRET, isString, [isNotEmpty]),
      apiEntityID: validate<string>('INVITATION_API_ENTITY_ID', env.INVITATION_API_ENTITY_ID, isString, [isNotEmpty]),
      apiSponsorName: validate<string>('INVITATION_API_SPONSOR_NAME', env.INVITATION_API_SPONSOR_NAME, isString, [isNotEmpty])
    }
    db = {
      host: validate<string>('DB_HOST', env.DB_HOST, isString, [isNotEmpty]),
      port: validate<number>('DB_PORT', prepNumber(env.DB_PORT), isNumber, [isNotNan, isInteger], 3306),
      name: validate<string>('DB_NAME', env.DB_NAME, isString, [isNotEmpty]),
      user: validate<string>('DB_USER', env.DB_USER, isString, [isNotEmpty]),
      password: validate<string>('DB_PASSWORD', env.DB_PASSWORD, isString, [isNotEmpty])
    }
    baseHelpURL = validate<string>('HELP_URL', env.HELP_URL, isString, [isNotEmpty], 'http://localhost:4020')
  } catch (error) {
    logger.error(error)
    throw new Error(String(error))
  }
  return { server, lti, canvas, invitation, db, baseHelpURL }
}
