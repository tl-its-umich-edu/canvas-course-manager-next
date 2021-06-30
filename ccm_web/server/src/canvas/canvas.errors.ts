export class CanvasOAuthAPIError extends Error {
  date: Date
  public name = 'CanvasOAuthError'

  constructor () {
    super('An error occurred while requesting or refreshing a Canvas OAuth access token.')
    this.date = new Date()
  }
}

export class CanvasTokenNotFoundError extends Error {
  date: Date
  public name = 'UserNotFoundError'

  constructor (userLoginId: string) {
    super(
      `The user ${userLoginId} does not have a CanvasToken and should; ` +
      'the database may have been modified or there may be a problem with the application code.'
    )
    this.date = new Date()
  }
}
