import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { CirrusInvitationService } from './cirrus-invitation.service.js'

@Module({
  imports: [
    ConfigModule,
    HttpModule
  ],
  providers: [CirrusInvitationService],
  exports: [CirrusInvitationService, HttpModule]
})
export class CirrusInvitationModule {}
