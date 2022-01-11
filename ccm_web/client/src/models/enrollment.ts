import { ClientEnrollmentType } from './canvas'

export interface AddExternalUserEnrollment {
  email: string
  role: ClientEnrollmentType
}

export interface AddNewExternalUserEnrollment extends AddExternalUserEnrollment {
  firstName: string
  lastName: string
}

export interface AddNumberedNewExternalUserEnrollment extends AddNewExternalUserEnrollment {
  rowNumber: number
}
