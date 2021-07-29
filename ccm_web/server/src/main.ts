import path from 'path'

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
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  app.enableCors({ credentials: true })

  const configService = app.get(ConfigService)
  const sequelize = app.get(Sequelize)
  const serverConfig = configService.get('server') as ServerConfig
  baseLogger.level = serverConfig.logLevel

  const isDev = process.env.NODE_ENV !== 'production'

  const stream = { write: (message: string) => { logger.info(message.trim()) } }
  app.use(morgan('combined', { stream: stream }))

  const staticPath = path.join(
    path.join(__dirname, '..', '..'),
    isDev ? path.join('dist', 'client') : 'client'
  )
  app.useStaticAssets(staticPath, { prefix: '/' })

  app.set('trust proxy', 1)

  const SequelizeStore = ConnectSessionSequelize(session.Store)
  const sessionStore = new SequelizeStore({ db: sequelize, tableName: 'session' })
  sessionStore.sync({ logging: (sql) => logger.info(sql) })

  app.use(
    session({
      store: sessionStore,
      secret: serverConfig.sessionSecret,
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
      .addBearerAuth({
        type: 'http',
        description: (
          'The bearer token can be found in the "token" URL parameter' +
          ' (use a browser tool to view the URL of the frame).'
        )
      })
      .build()

    const document = SwaggerModule.createDocument(app, swaggerConfig)
    SwaggerModule.setup('swagger', app, document)
  }

  await app.listen(
    serverConfig.port,
    () => logger.info(`Server started on localhost and port ${serverConfig.port}`)
  )
}

bootstrap()
  .then(() => logger.info('The application started successfully!'))
  .catch((e) => logger.error('An error occurred while starting the application: ', e))
