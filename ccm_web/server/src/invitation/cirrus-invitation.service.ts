import FormData from 'form-data'
import { randomUUID } from 'crypto'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { Injectable } from '@nestjs/common'
import baseLogger from '../logger'
import { CanvasUserLoginEmail } from '../canvas/canvas.interfaces'
import { Config, InvitationConfig } from '../config'
import { InvitationAPIError } from './invitation.errors'
import { lastValueFrom } from 'rxjs'
import { CirrusInvitationResponse } from './cirrus-invitation.interfaces'
import axios from 'axios'

const logger = baseLogger.child({ filePath: __filename })

@Injectable()
export class CirrusInvitationService {
  url: string
  entityID: string
  sponsorName: string
  key: string
  secret: string

  constructor (
    private readonly configService: ConfigService<Config, true>,
    private readonly httpService: HttpService
  ) {
    const invitationConfig = configService.get('invitation', { infer: true }) as InvitationConfig
    this.url = invitationConfig.apiURL
    this.entityID = invitationConfig.apiEntityID
    this.sponsorName = invitationConfig.apiSponsorName
    this.key = invitationConfig.apiKey
    this.secret = invitationConfig.apiSecret
  }

  async sendInvitations (users: CanvasUserLoginEmail[]): Promise<CirrusInvitationResponse> {
    if (users.length === 0) {
      throw new InvitationAPIError('Argument "users" array is empty.')
    }

    const userEmails: string[] = users.map(user => user.email)
    const emailAddressCSV = `emailAddress\n${userEmails.join('\n')}`

    const data = new FormData()
    data.append('cfile', emailAddressCSV, 'fake_file_name.csv')
    data.append('spEntityId', this.entityID)
    data.append('sponsorEppn', this.sponsorName)
    data.append('clientRequestID', 'ccm-' + randomUUID())

    try {
      const response = await lastValueFrom(this.httpService.post<CirrusInvitationResponse>(this.url, data, {
        auth: {
          username: this.key,
          password: this.secret
        },
        headers: {
          ...data.getHeaders()
        }
      }))

      return response.data
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response !== undefined) {
        return error.response.data
      }

      throw new InvitationAPIError(String(error.response.data))
    }
  }
}
