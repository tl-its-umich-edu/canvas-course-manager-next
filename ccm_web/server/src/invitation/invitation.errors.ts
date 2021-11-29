export class InvitationAPIError extends Error {
  date: Date
  public name = 'InvitationAPIError'

  constructor () {
    super('An error occurred while sending invitations.')
    this.date = new Date()
  }
}
