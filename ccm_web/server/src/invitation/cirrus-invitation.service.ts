import axios from 'axios'
import { randomUUID } from 'crypto'
import FormData from 'form-data'
import { lastValueFrom } from 'rxjs'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { Injectable } from '@nestjs/common'

import { CirrusErrorData, CirrusInvitationResponse } from './cirrus-invitation.interfaces'
import { InvitationAPIError } from './invitation.errors'

import { Config } from '../config'
import baseLogger from '../logger'

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
    const invitationConfig = configService.get('invitation', { infer: true })
    this.url = invitationConfig.apiURL
    this.entityID = invitationConfig.apiEntityID
    this.sponsorName = invitationConfig.apiSponsorName
    this.key = invitationConfig.apiKey
    this.secret = invitationConfig.apiSecret
  }

  async sendInvitations (userEmails: string[]): Promise<CirrusInvitationResponse | CirrusErrorData> {
    if (userEmails.length === 0) {
      throw new InvitationAPIError('Argument "userEmails" array is empty.')
    }

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
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response !== undefined) {
        logger.error(`Cirrus API error encountered: ${JSON.stringify(error.response.data)}`)
        const errors = error.response.data.errors as unknown
        const messages = (Array.isArray(errors) && errors.every(e => typeof e === 'string'))
          ? errors
          : [`Received an unexpected shape for Cirrus errors: ${JSON.stringify(errors)}`]
        return { statusCode: error.response.status, messages }
      }
      throw new InvitationAPIError(String(error))
    }
  }
}
