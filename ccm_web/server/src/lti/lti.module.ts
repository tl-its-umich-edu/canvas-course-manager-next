import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { LTIMiddleware } from './lti.middleware'
import { LTIService } from './lti.service'

@Module({
  imports: [ConfigModule],
  providers: [LTIService]
})
export class LtiModule implements NestModule {
  configure (consumer: MiddlewareConsumer) {
    consumer
      .apply(LTIMiddleware)
      .forRoutes('/')
  }
}
