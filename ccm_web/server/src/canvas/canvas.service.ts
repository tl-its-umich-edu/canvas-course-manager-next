import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class CanvasService {
  client: string
  secret: string

  constructor (private readonly configService: ConfigService) {
    this.client = configService.get('canvas.devKeyClient') as string
    this.secret = configService.get('canvas.devKeySecret') as string
  }

  // getCanvasToken
  // From the database (either in the User table, or another table connected by FK to User)

  // initiateOAuthFlow
}
