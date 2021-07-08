export class DatabaseError extends Error {
  date: Date
  public name = 'DatabaseError'

  constructor () {
    super('An error occurred while interacting with the application database.')
    this.date = new Date()
  }
}
