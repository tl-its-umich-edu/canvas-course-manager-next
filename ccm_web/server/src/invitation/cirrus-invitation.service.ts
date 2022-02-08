import FormData from 'form-data'
import { randomUUID } from 'crypto'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { Injectable } from '@nestjs/common'
import baseLogger from '../logger'
import { CanvasUserLoginEmail } from '../canvas/canvas.interfaces'
import { Config } from '../config'
import { InvitationAPIError } from './invitation.errors'
import { lastValueFrom } from 'rxjs'

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

  async sendInvitations (users: CanvasUserLoginEmail[]): Promise<string> {
    if (users.length == 0) {
      throw new InvitationAPIError('Argument "users" array is empty.')
    }

    const userEmails: string[] = users.map(user => user.email)
    const emailAddressCSV = `emailAddress\n${userEmails.join('\n')}` // FIXME: remove random UUID after debugging

    logger.debug(`emailAddressCSV: ${emailAddressCSV}`)

    const data = new FormData()
    data.append('cfile', emailAddressCSV, 'fake_file_name.csv')
    data.append('spEntityId', this.entityID)
    data.append('sponsorEppn', this.sponsorName)
    data.append('clientRequestID', 'ccm-' + randomUUID())

    const authEncoded = Buffer.from(`${this.key}:${this.secret}`).toString('base64')

    try {
      // Old axios technique…
      // const response = await axios({
      //   method: HttpMethod.Post,
      //   url: this.url,
      //   auth: {
      //     username: this.key,
      //     password: this.secret
      //   },
      //   headers: { ...data.getHeaders() },
      //   data: data
      // })

      /*
       * FIXME: Specify a type with `post<T>`, but unsure what are the possible
       * formats of the Cirrus responses.
       */
      const response = await lastValueFrom(this.httpService.post(this.url, data, {
        // auth: {
        //   username: this.key,
        //   password: this.secret
        // },
        headers: {
          'Authorization': authEncoded, ...data.getHeaders()
        }
      }))

      logger.debug(`response (as JSON) - ${JSON.stringify(response)}`)

      // logger.debug(response.data)
      // return response.data
      logger.debug(String(response))
      return String(response)
    } catch (error: any) {
      logger.info(`Caught error while sending invitations: ${JSON.stringify(error)}`)
      throw new InvitationAPIError(String(error.message))
    }
  }
}
