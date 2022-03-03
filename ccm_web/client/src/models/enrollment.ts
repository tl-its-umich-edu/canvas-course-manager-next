import { ClientEnrollmentType } from './canvas'
import { CSVRecord } from '../utils/FileParserWrapper'

interface RowNumberedData {
  rowNumber: number
}

export interface AddEnrollment {
  loginId: string
  role: ClientEnrollmentType
}

export interface RowNumberedAddEnrollment extends AddEnrollment, RowNumberedData {}

export interface AddEnrollmentWithSectionId extends AddEnrollment {
  sectionId: number
}

export interface RowNumberedAddEnrollmentWithSectionId extends AddEnrollmentWithSectionId, RowNumberedData {}

export interface AddExternalUserEnrollment {
  email: string
  role: ClientEnrollmentType
}

export interface AddNewExternalUserEnrollment extends AddExternalUserEnrollment {
  firstName: string
  lastName: string
}

export interface RowNumberedAddNewExternalUserEnrollment extends AddNewExternalUserEnrollment, RowNumberedData {}

// CSV-related constants, interfaces, and type guards

export const USER_ROLE_TEXT = 'role'
export const USER_ID_TEXT = 'login ID'
export const SECTION_ID_TEXT = 'section ID'

export const MAX_ENROLLMENT_RECORDS = 400
export const MAX_ENROLLMENT_MESSAGE = `The maximum number of user enrollments allowed is ${MAX_ENROLLMENT_RECORDS}.`

export const REQUIRED_ENROLLMENT_HEADERS = ['LOGIN_ID', 'ROLE']
export const REQUIRED_ENROLLMENT_WITH_SECTION_ID_HEADERS = [...REQUIRED_ENROLLMENT_HEADERS, 'SECTION_ID']

export interface EnrollmentRecord extends CSVRecord {
  LOGIN_ID: string
  ROLE: string
}

export const isEnrollmentRecord = (record: CSVRecord): record is EnrollmentRecord => {
  return REQUIRED_ENROLLMENT_HEADERS.every(h => typeof record[h] === 'string')
}

export interface EnrollmentWithSectionIdRecord extends CSVRecord {
  LOGIN_ID: string
  ROLE: string
  SECTION_ID: string
}

export const isEnrollmentWithSectionIdRecord = (record: CSVRecord): record is EnrollmentWithSectionIdRecord => {
  return REQUIRED_ENROLLMENT_WITH_SECTION_ID_HEADERS.every(h => typeof record[h] === 'string')
}
