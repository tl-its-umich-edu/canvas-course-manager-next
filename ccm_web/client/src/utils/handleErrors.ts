/*
Modified version of Remote Office Hours Queue implementation of custom errors and handleErrors
See https://github.com/tl-its-umich-edu/remote-office-hours-queue/blob/master/src/assets/src/services/api.ts
*/

import redirect from './redirect'
import { APIErrorData, APIErrorPayload } from '../models/models'

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

interface IDefaultError {
  errors: APIErrorPayload[]
}

class DefaultError extends Error implements IDefaultError {
  public name = 'DefaultError'
  errors: APIErrorPayload[]

  constructor (errors: APIErrorPayload[]) {
    super('Received one or more errors associated with this request from Canvas')
    this.errors = errors
  }
}

const handleErrors = async (resp: Response): Promise<void> => {
  if (resp.ok) return
  let text: string
  let errorBody: APIErrorData
  let canvasErrors: APIErrorPayload[]
  switch (resp.status) {
    case 401:
      text = await resp.text()
      console.error(text)
      errorBody = JSON.parse(text)
      if (errorBody.redirect === true) redirect('/')
      throw new UnauthorizedError()
    case 403:
      text = await resp.text()
      console.error(text)
      throw new ForbiddenError()
    case 404:
      text = await resp.text()
      console.error(text)
      throw new NotFoundError()
    default:
      canvasErrors = (JSON.parse(await resp.text()) as APIErrorData).errors
      throw new DefaultError(canvasErrors)
  }
}

export default handleErrors
