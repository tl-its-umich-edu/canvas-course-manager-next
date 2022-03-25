import cookieParser from 'cookie-parser'
import ConnectSessionSequelize from 'connect-session-sequelize'
import { urlencoded, json } from 'express'
import session from 'express-session'
import morgan from 'morgan'
import { Sequelize } from 'sequelize-typescript'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { AppModule } from './app.module'

import { Config } from './config'
import baseLogger from './logger'

const logger = baseLogger.child({ filePath: __filename })

async function bootstrap (): Promise<void> {
  const isDev = process.env.NODE_ENV !== 'production'

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: !isDev ? ['warn', 'error'] : undefined
  })

  const configService = app.get<ConfigService<Config, true>>(ConfigService)
  const sequelize = app.get(Sequelize)
  const serverConfig = configService.get('server', { infer: true })
  baseLogger.level = serverConfig.logLevel

  const stream = { write: (message: string) => { logger.info(message.trim()) } }
  app.use(morgan('combined', { stream: stream }))

  app.set('trust proxy', 1)

  app.use(cookieParser(serverConfig.cookieSecret))

  const SequelizeStore = ConnectSessionSequelize(session.Store)
  const sessionStore = new SequelizeStore({ db: sequelize, tableName: 'session' })
  sessionStore.sync({ logging: (sql) => logger.info(sql) })

  // Controls size limit of data in payload and URL
  const payloadSizeLimit = '5mb'
  app.use(json({ limit: payloadSizeLimit }))
  app.use(urlencoded({ extended: true, limit: payloadSizeLimit }))

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

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true
  }))

  if (isDev) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Canvas Course Manager')
      .setDescription('CCM application API description and explorer')
      .addSecurity(
        'CSRF-Token', {
          type: 'apiKey',
          name: 'CSRF-Token',
          in: 'header',
          description: (
            'POST and PUT requests need to include a CSRF-Token header. ' +
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

bootstrap()
  .then(() => logger.info('The application started successfully!'))
  .catch((e) => logger.error('An error occurred while starting the application: ', e))
