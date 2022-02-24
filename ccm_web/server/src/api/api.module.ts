import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { APIController } from './api.controller'
import { APIService } from './api.service'
import { CanvasModule } from '../canvas/canvas.module'
import { CanvasService } from '../canvas/canvas.service'
import { CirrusInvitationModule } from '../invitation/cirrus-invitation.module'
import { CirrusInvitationService } from '../invitation/cirrus-invitation.service'

@Module({
  imports: [CanvasModule, ConfigModule, CirrusInvitationModule],
  providers: [APIService, CanvasService, CirrusInvitationService],
  controllers: [APIController]
})
export class APIModule {}
