import { ClientEnrollmentType, isValidRole } from '../models/canvas'
import { InvalidationType } from '../models/models'
import { DuplicateIdentifierInRowsValidator, RowInvalidation } from '../utils/rowValidation'
import {
  emailSchema, firstNameSchema, lastNameSchema, loginIDSchema, validateString, ValidationResult
} from '../utils/validation'

export interface EnrollmentInvalidation extends RowInvalidation {}

interface EnrollmentRowsValidator {
  validate: (values: string[]) => EnrollmentInvalidation[]
}

const getMessage = (result: ValidationResult, fieldName: string): string => {
  return result.messages.length > 0 ? result.messages[0] : `Value for ${fieldName} is invalid.`
}

export class EmailRowsValidator implements EnrollmentRowsValidator {
  validate (emails: string[]): EnrollmentInvalidation[] {
    const invalidations: EnrollmentInvalidation[] = []
    emails.forEach((email, i) => {
      const emailValidationResult = validateString(email, emailSchema)
      if (!emailValidationResult.isValid) {
        invalidations.push({
          rowNumber: i + 2,
          message: getMessage(emailValidationResult, 'email address'),
          type: InvalidationType.Error
        })
      }
    })
    return invalidations
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
    const invalidations: EnrollmentInvalidation[] = []
    lastNames.forEach((lastName, i) => {
      const lastNameValidtionResult = validateString(lastName, lastNameSchema)
      if (!lastNameValidtionResult.isValid) {
        invalidations.push({
          rowNumber: i + 2,
          message: getMessage(lastNameValidtionResult, 'last name'),
          type: InvalidationType.Error
        })
      }
    })
    return invalidations
  }
}

export class FirstNameRowsValidator implements EnrollmentRowsValidator {
  validate (firstNames: string[]): EnrollmentInvalidation[] {
    const invalidations: EnrollmentInvalidation[] = []
    firstNames.forEach((firstName, i) => {
      const firstNameValidationResult = validateString(firstName, firstNameSchema)
      if (!firstNameValidationResult.isValid) {
        invalidations.push({
          rowNumber: i + 2,
          message: getMessage(firstNameValidationResult, 'first name'),
          type: InvalidationType.Error
        })
      }
    })
    return invalidations
  }
}

export class RoleRowsValidator implements EnrollmentRowsValidator {
  validate (roles: string[], allowedRoles?: ClientEnrollmentType[]): EnrollmentInvalidation[] {
    const invalidations: EnrollmentInvalidation[] = []
    roles.forEach((role, i) => {
      if (!isValidRole(role)) {
        invalidations.push({
          rowNumber: i + 2,
          message: `Value for role is invalid: "${role}"`,
          type: InvalidationType.Error
        })
      } else if (allowedRoles !== undefined && !allowedRoles.includes(role)) {
        invalidations.push({
          rowNumber: i + 2,
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
    const invalidations: EnrollmentInvalidation[] = []
    loginIDs.forEach((loginID, i) => {
      const loginIDValidationResult = validateString(loginID, loginIDSchema)
      if (!loginIDValidationResult.isValid) {
        invalidations.push({
          rowNumber: i + 2,
          message: getMessage(loginIDValidationResult, 'login ID'),
          type: InvalidationType.Error
        })
      }
    })
    return invalidations
  }
}
