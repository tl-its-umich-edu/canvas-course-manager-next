import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { APIController } from './api.controller'
import { APIService } from './api.service'
import { CanvasModule } from '../canvas/canvas.module'
import { CanvasService } from '../canvas/canvas.service'
import { InvitationModule } from '../invitation/invitation.module'
import { InvitationService } from '../invitation/invitation.service'

@Module({
  imports: [CanvasModule, ConfigModule, InvitationModule],
  providers: [APIService, CanvasService, InvitationService],
  controllers: [APIController]
})
export class APIModule {}
