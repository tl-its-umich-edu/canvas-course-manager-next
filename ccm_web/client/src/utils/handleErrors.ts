/*
Modified version of Remote Office Hours Queue implementation of custom errors and handleErrors
See https://github.com/tl-its-umich-edu/remote-office-hours-queue/blob/master/src/assets/src/services/api.ts
*/

import redirect from './redirect'
import { ExternalUserResult, isExternalUserAPIErrorData, isExternalUserFailure } from '../models/externalUser'
import { APIErrorData, CanvasAPIErrorPayload, isCanvasAPIErrorData } from '../models/models'

/*
Custom Error types
*/

class BadRequestError extends Error {
  public name = 'BadRequestError'
  constructor (message: string | undefined) {
    super('Your request was not valid.' + (message !== undefined ? ` ${message}` : ''))
  }
}

const defaultAuthzErrorMessage = (
  'You are not authorized to perform that action. ' +
  'Try re-launching the application, or contact support.'
)

class UnauthorizedError extends Error {
  public name = 'UnauthorizedError'
  constructor () {
    super(defaultAuthzErrorMessage)
  }
}

class ForbiddenError extends Error {
  public name = 'ForbiddenError'

  constructor (message?: string) {
    super(message ?? defaultAuthzErrorMessage)
  }
}

class NotFoundError extends Error {
  public name = 'NotFoundError'
  constructor () {
    super('The resource you are looking for was not found.')
  }
}

interface ICanvasError {
  errors: CanvasAPIErrorPayload[]
}

export interface ErrorDescription {
  input?: string
  context: string
  errorText: string
  action: string
}

enum RecommendedAction {
  TryAgainOrContact = 'Try again or contact support for assistance.',
  CheckOrContact = 'Check inputs or contact support for assistance.',
  Contact = 'Contact support for assistance.'
}

class CanvasError extends Error implements ICanvasError {
  public name = 'CanvasError'
  errors: CanvasAPIErrorPayload[]

  constructor (errors: CanvasAPIErrorPayload[]) {
    super('Received one or more errors associated with this request from Canvas')
    this.errors = errors
  }

  describeErrors (context?: string): ErrorDescription[] {
    return this.errors.map(e => ({
      input: e.failedInput ?? 'no input',
      context: `Error occurred while ${context ?? 'communicating with Canvas'}.`,
      errorText: e.message,
      action: e.canvasStatusCode >= 500
        ? RecommendedAction.TryAgainOrContact
        : e.canvasStatusCode >= 400
          ? RecommendedAction.CheckOrContact
          : RecommendedAction.Contact
    }))
  }
}

class ExternalUserProcessError extends Error {
  public name = 'ExternalUserProcessError'
  data: ExternalUserResult[]

  constructor (data: ExternalUserResult[]) {
    super(
      'Received one or more errors while creating an external user in Canvas ' +
      'and inviting them to select a login method using Cirrus.'
    )
    this.data = data
  }

  describeErrors (): ErrorDescription[] {
    const descriptions: ErrorDescription[] = []
    this.data.forEach(result => {
      if (isExternalUserFailure(result)) {
        if (result.userCreated !== true) {
          descriptions.push({
            input: result.email,
            context: 'Error occurred while creating the new user in Canvas.',
            errorText: result.userCreated.message,
            action: RecommendedAction.TryAgainOrContact
          })
        } else {
          descriptions.push({
            input: result.email,
            context: 'Error occurred while sending the user an email invitation to choose a login method.',
            errorText: result.invited.messages.join(' '),
            action: RecommendedAction.Contact
          })
        }
      }
    })
    return descriptions
  }
}

const handleErrors = async (resp: Response): Promise<void> => {
  if (resp.ok) return
  const text = await resp.text()
  console.error(text)
  let errorBody: APIErrorData
  try {
    errorBody = JSON.parse(text)
  } catch (error) {
    throw new Error(`Non-JSON error encountered with status code ${resp.status}`)
  }

  if (isCanvasAPIErrorData(errorBody)) throw new CanvasError(errorBody.errors)
  if (isExternalUserAPIErrorData(errorBody)) throw new ExternalUserProcessError(errorBody.data)

  const apiErrorMessage = Array.isArray(errorBody.message) ? errorBody.message.join(' ') : errorBody.message
  switch (resp.status) {
    case 400:
      throw new BadRequestError(apiErrorMessage)
    case 401:
      if (errorBody.redirect === true) redirect('/')
      throw new UnauthorizedError()
    case 403:
      throw new ForbiddenError(apiErrorMessage)
    case 404:
      throw new NotFoundError()
    default:
      throw new Error(apiErrorMessage)
  }
}

export { handleErrors as default, CanvasError, ExternalUserProcessError }
