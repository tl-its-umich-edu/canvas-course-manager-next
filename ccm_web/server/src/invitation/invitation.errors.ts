export class InvitationAPIError extends Error {
  date: Date
  public name = 'InvitationAPIError'

  constructor (message: any) {
    super(`An error occurred while sending invitations: ${message}`)
    this.date = new Date()
  }
}
