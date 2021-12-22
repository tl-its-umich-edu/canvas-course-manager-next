import { InvalidationType } from '../models/models'

// For validating row level issues
export interface RowInvalidation {
  message: string
  rowNumber: number
  type: InvalidationType
}

interface RowStringValuesValidator {
  valueName: string
  validate: (values: string[]) => RowInvalidation[]
}

export class DuplicateStringIdentifierInRowsValidator implements RowStringValuesValidator {
  valueName: string
  constructor (valueName: string) {
    this.valueName = valueName
  }

  validate = (values: string[]): RowInvalidation[] => {
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
          rowNumber: i + 2,
          type: InvalidationType.Error
        })
      }
    })
    return invalidations
  }
}
