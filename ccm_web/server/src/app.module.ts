import path from 'path'

import helmet from 'helmet'
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { SequelizeModule } from '@nestjs/sequelize'
import { ServeStaticModule } from '@nestjs/serve-static'

import { APIModule } from './api/api.module'
import { AuthModule } from './auth/auth.module'
import { CanvasModule } from './canvas/canvas.module'
import { CanvasToken } from './canvas/canvas.model'
import { LTIModule } from './lti/lti.module'
import { UserModule } from './user/user.module'
import { User } from './user/user.model'
import { UserService } from './user/user.service'

import { Config, validateConfig } from './config'
import baseLogger from './logger'

const logger = baseLogger.child({ filePath: __filename })

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
        exclude: ['/api*', '/canvas*', '/lti*', '/auth*']
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
    APIModule
  ],
  providers: [UserService]
})
export class AppModule implements NestModule {
  private readonly frameDomain: string

  constructor (
    private readonly configService: ConfigService<Config, true>
  ) {
    this.frameDomain = this.configService.get('server.frameDomain', { infer: true })
  }

  configure (consumer: MiddlewareConsumer): void {
    consumer.apply(helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: { 'frame-ancestors': [this.frameDomain] }
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
