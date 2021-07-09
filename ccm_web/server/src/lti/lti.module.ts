import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AuthModule } from '../auth/auth.module'
import { AuthService } from '../auth/auth.service'

import { LTIMiddleware } from './lti.middleware'
import { LTIService } from './lti.service'

@Module({
  imports: [AuthModule],
  providers: [
  // https://docs.nestjs.com/fundamentals/custom-providers
    {
      provide: LTIService,
      inject: [ConfigService, AuthService],
      useFactory: async (configService: ConfigService, authService: AuthService) => {
        const ltiService = new LTIService(configService, authService)
        await ltiService.setUpLTI()
        return ltiService
      }
    }
  ]
})
export class LTIModule implements NestModule {
  configure (consumer: MiddlewareConsumer): void {
    consumer
      .apply(LTIMiddleware)
      .forRoutes('/lti/')
  }
}
