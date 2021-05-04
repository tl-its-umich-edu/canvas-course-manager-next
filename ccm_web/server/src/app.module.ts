import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { BaseModule } from './base/base.module'
import { LtiModule } from './lti/lti.module'

import { validateConfig } from './config'

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: validateConfig,
      ignoreEnvFile: true
    }),
    LtiModule,
    BaseModule
  ]
})
export class AppModule {}
