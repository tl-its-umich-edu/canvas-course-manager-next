import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { APIController } from './api.controller.js'
import { APIService } from './api.service.js'
import { CanvasModule } from '../canvas/canvas.module.js'
import { CanvasService } from '../canvas/canvas.service.js'
import { CirrusInvitationModule } from '../invitation/cirrus-invitation.module.js'
import { CirrusInvitationService } from '../invitation/cirrus-invitation.service.js'

@Module({
  imports: [CanvasModule, ConfigModule, CirrusInvitationModule],
  providers: [APIService, CanvasService, CirrusInvitationService],
  controllers: [APIController]
})
export class APIModule {}
