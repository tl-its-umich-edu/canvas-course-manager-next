import { ClientEnrollmentType } from './canvas'

interface RowNumberedData {
  rowNumber: number
}

export interface AddEnrollment {
  loginID: string
  role: ClientEnrollmentType
}

export interface AddEnrollmentWithSectionID extends AddEnrollment {
  sectionID: number
}

export interface AddRowNumberedEnrollmentWithSectionID extends AddEnrollmentWithSectionID, RowNumberedData {}

export interface AddExternalUserEnrollment {
  email: string
  role: ClientEnrollmentType
}

export interface AddNewExternalUserEnrollment extends AddExternalUserEnrollment {
  firstName: string
  lastName: string
}

export interface AddNumberedNewExternalUserEnrollment extends AddNewExternalUserEnrollment, RowNumberedData {}
