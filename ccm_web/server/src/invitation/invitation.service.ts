import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Config } from '../config'
import { HttpService } from '@nestjs/axios'
import FormData from 'form-data'
import { randomUUID } from 'crypto'
import axios from 'axios'
import { InvitationAPIError } from './invitation.errors'
import { SectionUserDto } from '../api/dtos/api.section.users.dto'
import { CanvasUser } from '../canvas/canvas.interfaces'


// Invitation service based on Cirrus

@Injectable()
export class InvitationService {
  url: string
  entityID: string
  sponsorName: string
  key: string
  secret: string

  constructor (private readonly configService: ConfigService<Config, true>) {
    const invitationConfig = configService.get('invitation', { infer: true })
    // const domain = configService.get('server.domain', { infer: true })
    this.url = invitationConfig.apiURL
    this.entityID = invitationConfig.apiEntityID
    this.sponsorName = invitationConfig.apiSponsorName
    this.key = invitationConfig.apiKey
    this.secret = invitationConfig.apiSecret
  }

  async sendInvitations (users: CanvasUser[]): Promise<string> {
    const userEmails: string[] = users.map(user => user.loginId)
    const emailAddressCSV = `emailAddress\n${userEmails.join('\n')}`

    const data = new FormData()
    data.append('cfile', emailAddressCSV, 'fake_file_name.csv')
    data.append('spEntityId', this.entityID)
    data.append('sponsorEppn', this.sponsorName)
    data.append('clientRequestID', 'ccm-' + randomUUID())

    let results: string = 'n/a'

    axios({
      method: 'POST',
      url: this.url,
      auth: {
        username: this.key,
        password: this.secret
      },
      headers: { ...data.getHeaders() },
      data: data
    })
      .then((response) => {
        const results: string = JSON.stringify(response.data)
        console.log(results)
      })
      .catch((error) => {
        console.log(error)
        throw new InvitationAPIError()
      })

    return results
  }
}
