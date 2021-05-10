import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { LTIMiddleware } from './lti.middleware'
import { LTIService } from './lti.service'

@Module({
  imports: [ConfigModule],
  providers: [
  // https://docs.nestjs.com/fundamentals/custom-providers
    {
      provide: LTIService,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const ltiService = new LTIService(configService)
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
