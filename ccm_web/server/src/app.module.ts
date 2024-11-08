import path from 'node:path'

import helmet from 'helmet'
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { SequelizeModule } from '@nestjs/sequelize'
import { ServeStaticModule } from '@nestjs/serve-static'

import { APIModule } from './api/api.module.js'
import { AuthModule } from './auth/auth.module.js'
import { CanvasModule } from './canvas/canvas.module.js'
import { CanvasToken } from './canvas/canvas.model.js'
import { NoCacheInterceptor } from './no.cache.interceptor.js'
import { HealthModule } from './health/health.module.js'
import { LTIModule } from './lti/lti.module.js'
import { UserModule } from './user/user.module.js'
import { User } from './user/user.model.js'
import { UserService } from './user/user.service.js'

import { Config, validateConfig } from './config.js'
import baseLogger from './logger.js'

const __dirname = import.meta.dirname
const logger = baseLogger.child({ filePath: import.meta.filename })

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [validateConfig],
      ignoreEnvFile: true,
      isGlobal: true
    }),
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Config, true>) => ([{
        rootPath: (
          path.join(
            path.join(__dirname, '..', '..'),
            configService.get('server.isDev', { infer: true }) ? path.join('dist', 'client') : 'client'
          )
        ),
        exclude: ['/api/*', '/auth/*', '/canvas/*', '/health/*', '/lti/*']
      }])
    }),
    UserModule,
    LTIModule,
    AuthModule,
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Config, true>) => ({
        dialect: 'mysql',
        host: configService.get('db.host', { infer: true }),
        port: configService.get('db.port', { infer: true }),
        username: configService.get('db.user', { infer: true }),
        password: configService.get('db.password', { infer: true }),
        database: configService.get('db.name', { infer: true }),
        models: [CanvasToken, User],
        logging: (message: string) => logger.debug(message),
        define: { underscored: true } // Included here to ensure session table uses snake_case
      })
    }),
    CanvasModule,
    APIModule,
    HealthModule
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: NoCacheInterceptor
    },
    UserService
  ]
})
export class AppModule implements NestModule {
  private readonly frameDomain: string
  private readonly allowedScriptDomains: string[]

  constructor (private readonly configService: ConfigService<Config, true>) {
    this.frameDomain = this.configService.get('server.frameDomain', { infer: true })
    this.allowedScriptDomains = this.configService.get('server.allowedScriptDomains', { infer: true })
  }

  configure (consumer: MiddlewareConsumer): void {
    consumer.apply(helmet({
      contentSecurityPolicy: {
        directives: { 
          'frame-ancestors': [this.frameDomain],
          'script-src': ["'self'", ...this.allowedScriptDomains],
          'connect-src': ["'self'", ...this.allowedScriptDomains],
        }
      }
    }))
    // Exclude ltijs routes, which are already protected by helmet
      .exclude(
        { path: '/lti', method: RequestMethod.POST },
        { path: '/lti', method: RequestMethod.GET },
        '/lti/(.*)'
      )
      .forRoutes('*')
  }
}
