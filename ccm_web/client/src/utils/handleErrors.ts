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

const handleErrors = async (resp: Response): Promise<void> => {
  if (resp.ok) return
  let text: string
  switch (resp.status) {
    case 401:
      text = await resp.text()
      console.error(text)
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
      console.error(await resp.text())
      throw new Error(resp.statusText)
  }
}

export default handleErrors
