import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module'
import { ServerConfig } from './config'
import baseLogger from './logger'

const logger = baseLogger.child({ filePath: __filename })

async function bootstrap () {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)

  const serverConfig = configService.get('server') as ServerConfig
  baseLogger.level = serverConfig.logLevel

  await app.listen(
    serverConfig.port,
    () => logger.info(`Server started on localhost and port ${serverConfig.port}`)
  )
}

bootstrap()
  .then(() => logger.info('The application started successfully!'))
  .catch((e) => logger.error('An error occurred while starting the application: ', e))
