import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TerminusModule } from '@nestjs/terminus'

import { HealthController } from './health.controller'

@Module({
  controllers: [HealthController],
  imports: [ConfigModule, TerminusModule]
})
export class HealthModule {}
