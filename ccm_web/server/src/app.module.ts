import path from 'path'

import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ServeStaticModule } from '@nestjs/serve-static'

import { AppController } from './app.controller'
import { AppService } from './app.service'

import baseLogger from './logger'
import { validateConfig } from './config'

// baseLogger.level = config.server.logLevel
const logger = baseLogger.child({ filePath: __filename })

const isDev = process.env.NODE_ENV !== 'production'

const staticPath = path.join(
  path.join(__dirname, '..', '..'),
  isDev ? path.join('dist', 'client') : 'client'
)
logger.debug('Static path: ', staticPath)

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: validateConfig,
      ignoreEnvFile: true
    }),
    ServeStaticModule.forRoot({
      rootPath: staticPath
    })
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
