/*
Minimum temporary types for ltijs, building upon existing @types/ltijs and preliminary updates by the same author
See https://github.com/paulschwoerer/DefinitelyTyped/commit/9e9bec14b02e3c78051c07862d2c305a7ac98c39
This file does not include types for service classes (Grade, DeepLinking, NamesAndRoles, DynamicRegistration).

References
- https://www.typescriptlang.org/docs/handbook/declaration-files/templates/module-d-ts.html
- https://stackoverflow.com/questions/45099605/ambient-declaration-with-an-imported-type-in-typescript
*/

declare type ExpressRequest = import('express').Request
declare type ExpressResponse = import('express').Response
declare type NextFunction = import('express').NextFunction

declare module 'ltijs' {

  /* Platform */

  interface PlatformInfo {
    family_code: string
    version: string
    name: string
    description: string
  }

  interface PlatformAuthConfig {
    method: string
    key: string
  }

  interface PlatformConfig {
    url: string
    name: string
    clientId: string
    authenticationEndpoint: string
    accesstokenEndpoint: string
    authConfig: PlatformAuthConfig
  }

  interface PlatformContext {
    context: {
      id: string
      label: string
      title: string
      // changed to unknown
      type: unknown[]
    }
    resource: {
      title: string
      id: string
    }
    path: string
    user: string
    deploymentId: string
    targetLinkUri: string
    launchPresentation: {
      locale: string
      document_target: string
      return_url: string
    }
    messageType: string
    version: string
    createdAt: Date
    __v: number
    __id: string
    // changed to unknown
    custom: unknown
  }

  // Changed to class from interface
  class Platform {
    platformName (name?: string): Promise<string | boolean>

    platformUrl (url?: string): Promise<string | boolean>

    platformClientId (clientId?: string): Promise<string | boolean>

    platformKid (): string

    platformPublicKey (): Promise<string | false>

    platformPrivateKey (): Promise<string | false>

    platformAuthConfig (method: string, key: string): Promise<PlatformAuthConfig | boolean>

    platformAuthEndpoint (authEndpoint?: string): Promise<string | boolean>

    platformAccessTokenEndpoint (accesstokenEndpoint?: string): Promise<string | boolean>

    platformAccessToken (scopes: string): Promise<string | false>

    delete (): Promise<boolean>
  }

  /* IdToken */

  interface Endpoint {
    scope: string[]
    lineItems: string
    lineItem: string
  }

  interface IdToken {
    iss: string
    issuerCode: string
    user: string
    roles: string[]
    userInfo: UserInfo
    platformInfo: PlatformInfo
    endpoint: Endpoint
    clientId: string
  }

  /* Database */

  interface DatabaseOptionsPlugin {
    plugin: Database
  }

  interface DatabaseOptionsDefault {
    url: string
    connection: {
      user: string
      pass: string
      useNewUrlParser?: boolean
      keepAlive?: boolean
      keepAliveInitialDelay?: number
    }
  }

  type DatabaseOptions = DatabaseOptionsDefault | DatabaseOptionsPlugin

  // Changed to class from interface
  // Changed uses of object to Record<string, unknown>
  class Database {
    setup (): Promise<true>

    Close (): Promise<true>

    Get (
      encryptionKey: string | false,
      table: string, query: Record<string, unknown>
    ): Promise<Record<string, unknown> | false>

    Insert (
      encryptionKey: string | false,
      table: string,
      item: Record<>,
      index: Record<string, unknown>
    ): Promise<true>

    Replace (
      encryptionKey: string,
      table: string,
      query: Record<string, unknown>,
      item: Record<string, unknown>,
      index: Record<string, unknown>
    ): Promise<true>

    Modify (
      encryptionKey: string | false,
      table: string,
      query: Record<string, unknown>,
      modification: Record<string, unknown>
    ): Promise<true>

    Delete (collection: string, query: Record<string, unknown>): Promise<true>

    Encrypt (data: string, secret: string): Promise<{ iv: string, data: string }>

    Decrypt (data: string, _iv: string, secret: string): Promise<string>
  }

  /* Provider */

  type ServerAddonFunction = (app: Express) => void

  interface CookieOptions {
    secure?: boolean
    sameSite?: string
    domain?: string
  }

  interface SSLOptions {
    key: string
    cert: string
  }

  export interface ProviderOptions {
    appRoute?: string
    loginRoute?: string
    sesssionTimeoutRoute?: string
    invalidTokenRoute?: string
    keysetRoute?: string
    https?: boolean
    ssl?: SSLOptions
    staticPath?: string
    logger?: boolean
    cors?: boolean
    serverAddon?: ServerAddonFunction
    cookies?: CookieOptions
    tokenMaxAge?: number
    devMode?: boolean
  }

  interface DeploymentOptions {
    port?: number
    silent?: boolean
    serverless?: boolean
  }

  type ConnectionCallback = (
    connection: IdToken,
    request: ExpressRequest,
    response: ExpressResponse,
    next: NextFunction
  )
  /* eslint-disable @typescript-eslint/no-invalid-void-type */
  => Promise<ExpressResponse | void>

  type ErrorCallback = (req: Request, res: ExpressResponse) => Promise<ExpressResponse | void>

  interface RedirectOptions {
    newResource?: boolean
    ignoreRoot?: boolean
  }

  class Provider {
    readonly app: Express
    readonly Database: Database

    static setup (
      encryptionKey: string,
      database: DatabaseOptions,
      options?: ProviderOptions
    ): Provider

    deploy (options?: DeploymentOptions): Promise<true | undefined>

    close (): Promise<boolean>

    onConnect (_connectCallback: ConnectionCallback): true

    onDeepLinking (_connectCallback: ConnectionCallback): true

    onInvalidToken (_invalidTokenCallback: ErrorCallback): true

    onSessionTimeout (_sessionTimeoutCallback: ErrorCallback): true

    loginRoute (): string

    appRoute (): string

    sessionTimeoutRoute (): string

    invalidTokenRoute (): string

    keysetRoute (): string

    whitelist (...urls: Array<string | { route: string, method: string }>): true

    registerPlatform (config: PlatformConfig): Promise<Platform | false>

    getPlatform (url: string): Promise<Platform[] | false>

    getPlatform (url: string, clientId: string): Promise<Platform | false>

    deletePlatform (url: string, clientId: string): Promise<boolean>

    getAllPlatforms (): Promise<Platform[] | false>

    redirect (response: ExpressResponse, path: string, options?: RedirectOptions): void
  }
}
