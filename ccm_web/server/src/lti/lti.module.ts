import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { UserModule } from '../user/user.module'
import { UserService } from '../user/user.service'
import { LTIMiddleware } from './lti.middleware'
import { LTIService } from './lti.service'

@Module({
  imports: [UserModule],
  providers: [
  // https://docs.nestjs.com/fundamentals/custom-providers
    {
      provide: LTIService,
      inject: [ConfigService, UserService],
      useFactory: async (configService: ConfigService, userService: UserService) => {
        const ltiService = new LTIService(configService, userService)
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
      .forRoutes('/')
  }
}
