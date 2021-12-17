import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { InvitationService } from './invitation.service'

@Module({
  imports: [
    ConfigModule,
    HttpModule,
  ],
  providers: [InvitationService],
  exports: [InvitationService, HttpModule]
})
export class InvitationModule {}
