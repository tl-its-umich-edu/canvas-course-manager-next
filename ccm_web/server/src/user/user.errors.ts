export class UserNotFoundError extends Error {
  date: Date
  public name = 'UserNotFoundError'

  constructor (userLoginId: string) {
    super(
      `The user "${userLoginId}" could not be found; ` +
      'the database may have been modified or there may be a problem with the application code.'
    )
    this.date = new Date()
  }
}

export class RequestWithoutUserError extends Error {
  date: Date
  public name = 'RequestWithoutUserError'

  constructor () {
    super('The Request does not have a User record attached to it.')
    this.date = new Date()
  }
}
