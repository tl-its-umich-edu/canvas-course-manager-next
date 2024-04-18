import axios from 'axios'
import { randomUUID } from 'crypto'
import FormData from 'form-data'
import { lastValueFrom } from 'rxjs'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { Injectable } from '@nestjs/common'

import {
  cirrusAPIEndPoint, cirrusAPIVersion, CirrusErrorData, CirrusInvitationResponse, isCirrusAPIErrorData
} from './cirrus-invitation.interfaces.js'
import { InvitationAPIError } from './invitation.errors.js'

import { Config } from '../config.js'
import baseLogger from '../logger.js'

const logger = baseLogger.child({ filePath: import.meta.filename })

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
    const apiURL = invitationConfig.apiURL
    this.url = apiURL + cirrusAPIVersion + cirrusAPIEndPoint
    this.entityID = invitationConfig.apiEntityID
    this.sponsorName = invitationConfig.apiSponsorName
    this.key = invitationConfig.apiKey
    this.secret = invitationConfig.apiSecret
  }

  async sendInvitations (userEmails: string[]): Promise<CirrusInvitationResponse | CirrusErrorData> {
    if (userEmails.length === 0) {
      throw new Error('Argument "userEmails" array is empty.')
    }

    const requestID = `ccm-${randomUUID()}`
    const emailAddressCSV = `emailAddress\n${userEmails.join('\n')}`

    const data = new FormData()
    data.append('cfile', emailAddressCSV, `${requestID}-upload.csv`)
    data.append('spEntityId', this.entityID)
    data.append('sponsorEppn', this.sponsorName)
    data.append('clientRequestID', requestID)

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
    } catch (error) {
      if (axios.isAxiosError(error) && error.response !== undefined) {
        logger.error(`Cirrus API error encountered: ${JSON.stringify(error.response.data)}`)
        const { data } = error.response
        const messages = isCirrusAPIErrorData(data)
          ? data.errors
          : [`Received an unexpected shape for Cirrus errors: ${JSON.stringify(data)}`]
        return { statusCode: error.response.status, messages }
      }
      throw new InvitationAPIError(String(error))
    }
  }
}
