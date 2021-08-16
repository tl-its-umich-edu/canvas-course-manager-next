import helmet from 'helmet'
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { SequelizeModule } from '@nestjs/sequelize'

import { APIModule } from './api/api.module'
import { AuthModule } from './auth/auth.module'
import { CanvasModule } from './canvas/canvas.module'
import { CanvasToken } from './canvas/canvas.model'
import { LTIModule } from './lti/lti.module'
import { UserModule } from './user/user.module'
import { User } from './user/user.model'
import { UserService } from './user/user.service'

import { validateConfig } from './config'
import baseLogger from './logger'

const logger = baseLogger.child({ filePath: __filename })

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [validateConfig],
      ignoreEnvFile: true,
      isGlobal: true
    }),
    UserModule,
    LTIModule,
    AuthModule,
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: 'mysql',
        host: configService.get('db.host'),
        port: configService.get('db.port'),
        username: configService.get('db.user'),
        password: configService.get('db.password'),
        database: configService.get('db.name'),
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
  configure (consumer: MiddlewareConsumer): void {
    consumer.apply(helmet())
    // Exclude ltijs routes, which are already protected by helmet
      .exclude(
        { path: '/lti', method: RequestMethod.POST },
        { path: '/lti', method: RequestMethod.GET },
        '/lti/(.*)'
      )
      .forRoutes('*')
  }
}
