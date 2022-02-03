import axios from 'axios'
import FormData from 'form-data'
import { randomUUID } from 'crypto'
import { ConfigService } from '@nestjs/config'
import { Injectable } from '@nestjs/common'
import baseLogger from '../logger'
import { CanvasUserLoginEmail } from '../canvas/canvas.interfaces'
import { Config } from '../config'
import { HttpMethod } from '../api/api.utils'
import { InvitationAPIError } from './invitation.errors'

const logger = baseLogger.child({ filePath: __filename })

@Injectable()
export class CirrusInvitationService {
  url: string
  entityID: string
  sponsorName: string
  key: string
  secret: string

  constructor (private readonly configService: ConfigService<Config, true>) {
    const invitationConfig = configService.get('invitation', { infer: true })
    this.url = invitationConfig.apiURL
    this.entityID = invitationConfig.apiEntityID
    this.sponsorName = invitationConfig.apiSponsorName
    this.key = invitationConfig.apiKey
    this.secret = invitationConfig.apiSecret
  }

  async sendInvitations (users: CanvasUserLoginEmail[]): Promise<string> {
    const userEmails: string[] = users.map(user => user.email)
    const emailAddressCSV = `emailAddress\n${userEmails.join('\n')}`

    const data = new FormData()
    data.append('cfile', emailAddressCSV, 'fake_file_name.csv')
    data.append('spEntityId', this.entityID)
    data.append('sponsorEppn', this.sponsorName)
    data.append('clientRequestID', 'ccm-' + randomUUID())

    try {
      const response = await axios({
        method: HttpMethod.Post,
        url: this.url,
        auth: {
          username: this.key,
          password: this.secret
        },
        headers: { ...data.getHeaders() },
        data: data
      })

      logger.debug(response.data)
      return response.data
    } catch (error) {
      logger.info(`Caught error while sending invitations: ${String(error)}`)
      throw new InvitationAPIError(String(error))
    }
  }
}
