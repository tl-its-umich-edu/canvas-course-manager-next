import path from 'path'

import cookieParser from 'cookie-parser'
import ConnectSessionSequelize from 'connect-session-sequelize'
import session from 'express-session'
import morgan from 'morgan'
import { Sequelize } from 'sequelize-typescript'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { AppModule } from './app.module'

import { ServerConfig } from './config'
import baseLogger from './logger'

const logger = baseLogger.child({ filePath: __filename })

async function bootstrap (): Promise<void> {
  const isDev = process.env.NODE_ENV !== 'production'

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: !isDev ? ['warn', 'error'] : undefined
  })

  const configService = app.get(ConfigService)
  const sequelize = app.get(Sequelize)
  const serverConfig = configService.get('server') as ServerConfig
  baseLogger.level = serverConfig.logLevel

  const stream = { write: (message: string) => { logger.info(message.trim()) } }
  app.use(morgan('combined', { stream: stream }))

  const staticPath = path.join(
    path.join(__dirname, '..', '..'),
    isDev ? path.join('dist', 'client') : 'client'
  )
  app.useStaticAssets(staticPath, { prefix: '/' })

  app.set('trust proxy', 1)

  app.use(cookieParser(serverConfig.cookieSecret))

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
        sameSite: 'none'
      }
    })
  )

  app.useGlobalPipes(new ValidationPipe())

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

  if (!isDev) {
    process.on('SIGINT', function () {
      logger.info('SIGINT signal received; shutting down...')
      app.close()
        .then(() => logger.info('The application shut down gracefully.'))
        .catch(() => logger.error('The application failed to shut down gracefully.'))
    })
  }

  const hostname = '0.0.0.0'

  await app.listen(
    serverConfig.port, hostname,
    () => logger.info(`Server started on ${hostname} and port ${serverConfig.port}`)
  )
  logger.info('ip?')
  logger.info(await app.getUrl())
}

bootstrap()
  .then(() => logger.info('The application started successfully!'))
  .catch((e) => logger.error('An error occurred while starting the application: ', e))
