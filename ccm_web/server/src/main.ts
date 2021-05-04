import path from 'path'

import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'

import { AppModule } from './app.module'
import { ServerConfig } from './config'
import baseLogger from './logger'

const logger = baseLogger.child({ filePath: __filename })

async function bootstrap () {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  const configService = app.get(ConfigService)
  const serverConfig = configService.get('server') as ServerConfig
  baseLogger.level = serverConfig.logLevel

  const isDev = process.env.NODE_ENV !== 'production'

  const staticPath = path.join(
    path.join(__dirname, '..', '..'),
    isDev ? path.join('dist', 'client') : 'client'
  )
  app.useStaticAssets(staticPath, { prefix: '/' })

  await app.listen(
    serverConfig.port,
    () => logger.info(`Server started on localhost and port ${serverConfig.port}`)
  )
}

bootstrap()
  .then(() => logger.info('The application started successfully!'))
  .catch((e) => logger.error('An error occurred while starting the application: ', e))
