import { MiddlewareConsumer, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'

import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { CSRFErrorFilter } from './csrf.error.filter'
import { CSRFProtectionMiddleware } from './csrf.middleware'
import { JwtStrategy } from './jwt.strategy'
import { UserModule } from '../user/user.module'

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('server.encryptionSecret'),
        // TO DO: Do we need to figure out how to handle expiration?
        signOptions: { expiresIn: '1 day' }
      })
    })
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: 'APP_FILTER',
      useClass: CSRFErrorFilter
    }
  ],
  exports: [AuthService, JwtModule]
})
export class AuthModule {
  configure (consumer: MiddlewareConsumer): void {
    consumer.apply(CSRFProtectionMiddleware).forRoutes('/')
  }
}
