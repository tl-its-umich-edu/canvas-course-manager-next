import { Express, Request, Response } from 'express'
import { BeforeApplicationShutdown, HttpStatus, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { IdToken, Provider as LTIProvider } from 'ltijs'
import Database from 'ltijs-sequelize'

import { AuthService } from '../auth/auth.service'

import baseLogger from '../logger'
import { Config } from '../config'

const logger = baseLogger.child({ filePath: __filename })

const createLaunchErrorResponse = (res: Response, action?: string): Response => {
  const message = (
    'The launch of the application failed; ' +
    (action !== undefined ? action : 'please try to refresh the page or contact support.')
  )
  return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(message)
}

// the array of user roles that are allowed to use CCM tool
const allowedRoles = ['TeacherEnrollment', 'TaEnrollment', 'ObserverEnrollment', 'DesignerEnrollment', 'Account Admin', 'Sub-Account Admin']

// ltijs docs: https://cvmcosta.me/ltijs/#/
@Injectable()
export class LTIService implements BeforeApplicationShutdown {
  provider: LTIProvider | undefined

  constructor (private readonly configService: ConfigService<Config, true>, private readonly authService: AuthService) {}

  async setUpLTI (): Promise<void> {
    const dbConfig = this.configService.get('db', { infer: true })
    const ltiConfig = this.configService.get('lti', { infer: true })

    logger.info('Initializng ltijs as middleware')

    const dbPlugin = new Database(
      dbConfig.name,
      dbConfig.user,
      dbConfig.password,
      { host: dbConfig.host, dialect: 'mysql', port: dbConfig.port, logging: false }
    )

    const provider = LTIProvider.setup(
      ltiConfig.encryptionKey, // Key used to sign cookies and tokens
      { plugin: dbPlugin },
      {
        // Reserved routes
        appRoute: '/',
        loginRoute: '/login',
        keysetRoute: '/keys',
        // Set secure to true if the testing platform is in a different domain and https is being used
        // Set sameSite to 'None' if the testing platform is in a different domain and https is being used
        cookies: { secure: true, sameSite: 'None' }
      }
    )

    // Redirect to the Canvas token check and OAuth workflow after a successful launch
    provider.onConnect(async (token: IdToken, req: Request, res: Response) => {
      logger.debug(`The LTI launch was successful! User info: ${JSON.stringify(token.userInfo)}`)
      const customLTIVariables = token.platformContext.custom
      if (customLTIVariables.login_id === undefined || customLTIVariables.course_id === undefined ||
        customLTIVariables.roles === undefined || customLTIVariables.is_root_account_admin === undefined) {
        return createLaunchErrorResponse(res, 'please check the LTI configuration in Canvas.')
      }
      const loginId = customLTIVariables.login_id as string
      const courseId = customLTIVariables.course_id as number
      const roles = customLTIVariables.roles as string
      const isRootAdmin = customLTIVariables.is_root_account_admin as boolean

      // check whether the user roles are all included in the allowed roles set
      // otherwise show error message to the user
      const rolesArray = roles.length > 0 ? roles.split(',') : []
      const roleDiff = rolesArray.filter(x => !allowedRoles.includes(x))
      if (roleDiff.length > 0) {
        return createLaunchErrorResponse(res, 'Your role in this course does not allow access to this tool. If you feel this is in error, please contact 4help@umich.edu.')
      }

      try {
        await this.authService.loginLTI({
          firstName: token.userInfo.given_name,
          lastName: token.userInfo.family_name,
          email: token.userInfo.email,
          loginId: loginId
        }, res)
      } catch (e) {
        const logMessageEnding = e instanceof Error
          ? `error ${String(e.name)} due to ${String(e.message)}`
          : String(e)
        logger.error(`Something went wrong while creating user with loginId ${loginId}: ${logMessageEnding}`)
        return createLaunchErrorResponse(res)
      }
      // More data will be added to the session here later
      const course = {
        id: courseId,
        roles: (roles.length > 0) ? roles.split(',') : [] // role won't be empty but adding a validation for safety
      }
      const sessionData = {
        course: course,
        isRootAdmin: isRootAdmin
      }
      req.session.data = sessionData
      req.session.save((err) => {
        if (err !== null) {
          logger.error('Failed to save session data due to error: ', err)
          return createLaunchErrorResponse(res)
        }
        return res.redirect('/')
      })
    })

    await provider.deploy({ serverless: true })

    await provider.registerPlatform({
      name: ltiConfig.platformURL,
      url: ltiConfig.platformURL,
      clientId: ltiConfig.clientID,
      authenticationEndpoint: ltiConfig.platformURL + ltiConfig.authEnding,
      accesstokenEndpoint: ltiConfig.platformURL + ltiConfig.tokenEnding,
      authConfig: {
        method: 'JWK_SET', key: ltiConfig.platformURL + ltiConfig.keysetEnding
      }
    })

    this.provider = provider
  }

  getMiddleware (): Express | undefined {
    return this.provider?.app
  }

  beforeApplicationShutdown (): void {
    this.provider?.close()
  }
}
