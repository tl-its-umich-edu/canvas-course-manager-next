import { ClientEnrollmentType, isValidRole } from '../models/canvas'
import { InvalidationType } from '../models/models'
import { getRowNumber } from './fileUtils'
import { DuplicateIdentifierInRowsValidator, RowInvalidation, StringRowsSchemaValidator } from '../utils/rowValidation'
import {
  emailSchema, firstNameSchema, lastNameSchema, loginIDSchema, sectionIdSchema, validateNumberString
} from '../utils/validation'

export interface EnrollmentInvalidation extends RowInvalidation {}

interface EnrollmentRowsValidator {
  validate: (values: string[]) => EnrollmentInvalidation[]
}

export class EmailRowsValidator implements EnrollmentRowsValidator {
  validate (emails: string[]): EnrollmentInvalidation[] {
    const emailValidator = new StringRowsSchemaValidator(emailSchema, 'email address')
    return emailValidator.validate(emails)
  }
}

export class DuplicateEmailRowsValidator implements EnrollmentRowsValidator {
  validate (emails: string[]): EnrollmentInvalidation[] {
    const dupEmailValidator = new DuplicateIdentifierInRowsValidator('email address')
    return dupEmailValidator.validate(emails)
  }
}

export class LastNameRowsValidator implements EnrollmentRowsValidator {
  validate (lastNames: string[]): EnrollmentInvalidation[] {
    const lastNamesValidator = new StringRowsSchemaValidator(lastNameSchema, 'last name')
    return lastNamesValidator.validate(lastNames)
  }
}

export class FirstNameRowsValidator implements EnrollmentRowsValidator {
  validate (firstNames: string[]): EnrollmentInvalidation[] {
    const firstNameValidator = new StringRowsSchemaValidator(firstNameSchema, 'first name')
    return firstNameValidator.validate(firstNames)
  }
}

export class RoleRowsValidator implements EnrollmentRowsValidator {
  allowedRoles?: ClientEnrollmentType[]

  constructor (allowedRoles?: ClientEnrollmentType[]) {
    this.allowedRoles = allowedRoles
  }

  validate (roles: string[]): EnrollmentInvalidation[] {
    const invalidations: EnrollmentInvalidation[] = []
    roles.forEach((role, i) => {
      if (!isValidRole(role)) {
        invalidations.push({
          rowNumber: getRowNumber(i),
          message: `Value for role is invalid: "${role}"`,
          type: InvalidationType.Error
        })
      } else if (this.allowedRoles !== undefined && !this.allowedRoles.includes(role)) {
        invalidations.push({
          rowNumber: getRowNumber(i),
          message: `You are not allowed to enroll users with the provided role: "${role}"`,
          type: InvalidationType.Error
        })
      }
    })
    return invalidations
  }
}

export class LoginIDRowsValidator implements EnrollmentRowsValidator {
  validate (loginIDs: string[]): EnrollmentInvalidation[] {
    const loginIDValidator = new StringRowsSchemaValidator(loginIDSchema, 'login ID')
    return loginIDValidator.validate(loginIDs)
  }
}

export class SectionIdRowsValidator implements EnrollmentRowsValidator {
  existingSectionIDs: number[]
  constructor (existingSectionIDs: number[]) {
    this.existingSectionIDs = existingSectionIDs
  }

  validate (sectionIds: string[]): EnrollmentInvalidation[] {
    const invalidations: EnrollmentInvalidation[] = []
    sectionIds.forEach((sectionId, i) => {
      const result = validateNumberString(sectionId, sectionIdSchema)
      if (result.transformedValue === undefined || !result.isValid) {
        invalidations.push({
          rowNumber: getRowNumber(i),
          message: result.messages.length > 0 ? result.messages[0] : 'Value for the section ID was invalid.',
          type: InvalidationType.Error
        })
      } else {
        const sectionIdNum = result.transformedValue
        if (!this.existingSectionIDs.includes(sectionIdNum)) {
          invalidations.push({
            rowNumber: getRowNumber(i),
            message: `This course does not have a section with ID "${sectionIdNum}".`,
            type: InvalidationType.Error
          })
        }
      }
    })
    return invalidations
  }
}
