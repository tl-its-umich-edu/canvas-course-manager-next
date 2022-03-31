export class TooManyResultsError extends Error {
  date: Date
  public name = 'TooManyResultsError'

  constructor () {
    super('An API call or combination of calls returned too many results to process.')
    this.date = new Date()
  }
}
