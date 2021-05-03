import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { LTIMiddleware } from './lti.middleware'

@Module({
  imports: [ConfigModule]
})
export class LtiModule implements NestModule {
  configure (consumer: MiddlewareConsumer) {
    consumer
      .apply(LTIMiddleware)
      .forRoutes('/')
  }
}
