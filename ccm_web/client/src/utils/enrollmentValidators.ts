import { ClientEnrollmentType, isValidRole } from '../models/canvas'
import { InvalidationType } from '../models/models'
import { DuplicateIdentifierInRowsValidator, RowInvalidation, StringRowsSchemaValidator } from '../utils/rowValidation'
import { emailSchema, firstNameSchema, lastNameSchema, loginIDSchema } from '../utils/validation'

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
    const loginIDValidator = new StringRowsSchemaValidator(loginIDSchema, 'login ID')
    return loginIDValidator.validate(loginIDs)
  }
}
