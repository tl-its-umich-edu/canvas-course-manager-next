import { fileURLToPath } from 'node:url'
import process from 'node:process'
import cookieParser from 'cookie-parser'
import ConnectSessionSequelize from 'connect-session-sequelize'
import { urlencoded, json } from 'express'
import session from 'express-session'
import morgan from 'morgan'
import { Sequelize } from 'sequelize-typescript'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { AppModule } from './app.module.js'

import { Config, ServerConfig } from './config.js'
import baseLogger from './logger.js'

const logger = baseLogger.child({ filePath: import.meta.filename })

type PartialServerConfig = Omit<ServerConfig, 'isDev' | 'port'>

export function doAppCoreSetup (app: INestApplication, serverConfig: PartialServerConfig): void {
  // Logging
  baseLogger.level = serverConfig.logLevel
  const stream = { write: (message: string) => { logger.info(message.trim()) } }
  app.use(morgan('combined', { stream: stream }))

  // Controls size limit of data in payload and URL
  const payloadSizeLimit = '5mb'
  app.use(json({ limit: payloadSizeLimit }))
  app.use(urlencoded({ extended: true, limit: payloadSizeLimit }))
  
  const sequelize = app.get(Sequelize)
  const SequelizeStore = ConnectSessionSequelize(session.Store)
  const sessionStore = new SequelizeStore({ db: sequelize, tableName: 'session' })
  sessionStore.sync({ logging: (sql) => logger.info(sql) })
  
  app.use(
    session({
      store: sessionStore,
      secret: serverConfig.cookieSecret,
      resave: false,
      saveUninitialized: false,
      proxy: true,
      cookie: {
        domain: serverConfig.domain,
        secure: true,
        sameSite: 'none',
        maxAge: serverConfig.maxAgeInSec * 1000
      }
    })
    )
    // Cookies and Sessions
    app.use(cookieParser(serverConfig.cookieSecret))

  // Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true
  }))
}

async function bootstrap (): Promise<void> {
  const isDev = process.env.NODE_ENV !== 'production'

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: !isDev ? ['warn', 'error'] : undefined
  })

  const configService = app.get<ConfigService<Config, true>>(ConfigService)
  const serverConfig = configService.get('server', { infer: true })

  app.set('trust proxy', 1)

  doAppCoreSetup(app, serverConfig)

  if (isDev) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Canvas Course Manager')
      .setDescription('CCM application API description and explorer')
      .addSecurity(
        'x-csrf-token', {
          type: 'apiKey',
          name: 'x-csrf-token',
          in: 'header',
          description: (
            'POST and PUT requests need to include a x-csrf-token header. ' +
            'The token can be found in the "csrfToken" URL parameter ' +
            '(use a browser tool to view the URL of the frame).'
          )
        })
      .build()

    const document = SwaggerModule.createDocument(app, swaggerConfig)
    SwaggerModule.setup('swagger', app, document)
  }

  if (!isDev) app.enableShutdownHooks(['SIGINT'])

  await app.listen(
    serverConfig.port,
    () => logger.info(`Server started on 0.0.0.0 and port ${serverConfig.port}`)
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  bootstrap()
    .then(() => logger.info('The application started successfully!'))
    .catch((e) => logger.error('An error occurred while starting the application: ', e))
}
