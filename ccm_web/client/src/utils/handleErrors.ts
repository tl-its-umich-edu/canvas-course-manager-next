/*
Modified version of Remote Office Hours Queue implementation of custom errors and handleErrors
See https://github.com/tl-its-umich-edu/remote-office-hours-queue/blob/master/src/assets/src/services/api.ts
*/

import redirect from './redirect'
import { APIErrorData, APIErrorPayload, isCanvasAPIErrorData } from '../models/models'

/*
Custom Error types
*/

class UnauthorizedError extends Error {
  public name = 'UnauthorizedError'
  constructor () {
    super(
      'You are not authorized to perform that action. ' +
      'You may need to authenticate differently.'
    )
  }
}

class ForbiddenError extends Error {
  public name = 'ForbiddenError'
  constructor () {
    super('You are not authorized to perform that action.')
  }
}

class NotFoundError extends Error {
  public name = 'NotFoundError'
  constructor () {
    super('The resource you are looking for was not found.')
  }
}

interface ICanvasError {
  errors: APIErrorPayload[]
}

class CanvasError extends Error implements ICanvasError {
  public name = 'CanvasError'
  errors: APIErrorPayload[]

  constructor (errors: APIErrorPayload[]) {
    super('Received one or more errors associated with this request from Canvas')
    this.errors = errors
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
    throw new Error(`Non-JSON error encountered with status code ${resp.status}.`)
  }

  switch (resp.status) {
    case 401:
      if (errorBody.redirect === true) redirect('/')
      throw new UnauthorizedError()
    case 403:
      if (isCanvasAPIErrorData(errorBody)) {
        throw new CanvasError(errorBody.errors)
      }
      throw new ForbiddenError()
    case 404:
      if (isCanvasAPIErrorData(errorBody)) {
        throw new CanvasError(errorBody.errors)
      }
      throw new NotFoundError()
    default:
      if (isCanvasAPIErrorData(errorBody)) {
        throw new CanvasError(errorBody.errors)
      } else {
        const message = Array.isArray(errorBody.message)
          ? errorBody.message.join(' ')
          : errorBody.message
        throw new Error(message)
      }
  }
}

export const extractErrorText = (error: Error): string[] => {
  if (error instanceof CanvasError) {
    return error.errors.map(e => e.message)
  } else {
    return [error.message]
  }
}

export { handleErrors as default, CanvasError }
