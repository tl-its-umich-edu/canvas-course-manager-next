import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { APIModule } from './api/api.module'
import { LTIModule } from './lti/lti.module'

import { validateConfig } from './config'

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: validateConfig,
      ignoreEnvFile: true,
      isGlobal: true
    }),
    LTIModule,
    APIModule
  ]
})
export class AppModule {}
