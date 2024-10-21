import { StringSchema } from 'yup'

import { getRowNumber } from './fileUtils.js'
import { validateString, ValidationResult } from './validation.js'
import { InvalidationType } from '../models/models.js'

// For validating row level issues
export interface RowInvalidation {
  message: string
  rowNumber: number
  type: InvalidationType
}

interface RowStringValuesValidator {
  readonly valueName: string
  validate: (values: string[]) => RowInvalidation[]
}

export class DuplicateIdentifierInRowsValidator implements RowStringValuesValidator {
  readonly valueName: string
  constructor (valueName: string) {
    this.valueName = valueName
  }

  validate (values: string[]): RowInvalidation[] {
    const sortedValues = values.map(n => { return n.toUpperCase() }).sort((a, b) => { return a.localeCompare(b) })
    const duplicates: string[] = []
    for (let i = 1; i < sortedValues.length; ++i) {
      if (sortedValues[i - 1] === sortedValues[i] && !duplicates.includes(sortedValues[i])) {
        duplicates.push(sortedValues[i])
      }
    }
    if (duplicates.length === 0) {
      return []
    }
    const invalidations: RowInvalidation[] = []
    values.forEach((value, i) => {
      if (duplicates.includes(value.toUpperCase())) {
        invalidations.push({
          message: `Duplicate ${this.valueName} found in this file: "${value}"`,
          rowNumber: getRowNumber(i),
          type: InvalidationType.Error
        })
      }
    })
    return invalidations
  }
}

export class StringRowsSchemaValidator implements RowStringValuesValidator {
  readonly schema: StringSchema
  readonly valueName: string

  constructor (schema: StringSchema, valueName: string) {
    this.schema = schema
    this.valueName = valueName
  }

  private getMessage (result: ValidationResult): string {
    return result.messages.length > 0 ? result.messages[0] : `Value for ${this.valueName} is invalid.`
  }

  validate (values: string[]): RowInvalidation[] {
    const invalidations: RowInvalidation[] = []
    values.forEach((value, i) => {
      const validationResult = validateString(value, this.schema)
      if (!validationResult.isValid) {
        invalidations.push({
          rowNumber: getRowNumber(i),
          message: this.getMessage(validationResult),
          type: InvalidationType.Error
        })
      }
    })
    return invalidations
  }
}
