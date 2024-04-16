import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { APP_FILTER } from '@nestjs/core'

import { AuthController } from './auth.controller.js'
import { AuthService } from './auth.service.js'
import { CSRFExceptionFilter } from './csrf.exception.filter.js'
import { DoubleCSRFProtectionMiddleware } from './double.csrf.middleware.js'
import { JwtStrategy } from './jwt.strategy.js'
import { UserModule } from '../user/user.module.js'

import { Config } from '../config.js'

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<Config, true>) => ({
        secret: configService.get<string>('server.tokenSecret', { infer: true }),
        signOptions: { expiresIn: configService.get<number>('server.maxAgeInSec', { infer: true }) }
      })
    })
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: APP_FILTER,
      useClass: CSRFExceptionFilter
    }
  ],
  exports: [AuthService, JwtModule]
})
export class AuthModule implements NestModule {
  configure (consumer: MiddlewareConsumer): void {
    consumer.apply(DoubleCSRFProtectionMiddleware).forRoutes('/')
  }
}
