import { ClientEnrollmentType } from './canvas'

interface RowNumberedData {
  rowNumber: number
}

export interface AddEnrollment {
  loginID: string
  role: ClientEnrollmentType
}

export interface AddEnrollmentWithSectionId extends AddEnrollment {
  sectionId: number
}

export interface AddRowNumberedEnrollmentWithSectionId extends AddEnrollmentWithSectionId, RowNumberedData {}

export interface AddExternalUserEnrollment {
  email: string
  role: ClientEnrollmentType
}

export interface AddNewExternalUserEnrollment extends AddExternalUserEnrollment {
  firstName: string
  lastName: string
}

export interface AddNumberedNewExternalUserEnrollment extends AddNewExternalUserEnrollment, RowNumberedData {}
