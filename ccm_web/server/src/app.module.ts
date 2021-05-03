import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { AppController } from './app.controller'
import { AppService } from './app.service'
import { LtiModule } from './lti/lti.module'

import { validateConfig } from './config'

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: validateConfig,
      ignoreEnvFile: true
    }),
    LtiModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
