import { InvalidationType } from '../models/models'
import { GradebookRecord } from '../pages/GradebookCanvas'

interface GradebookRowInvalidation {
  message: string
  rowNumber: number
  type: InvalidationType
}

class CurrentAndFinalGradeInvalidation implements GradebookRowInvalidation {
  message: string
  record: GradebookRecord
  rowNumber: number
  type: InvalidationType
  constructor (record: GradebookRecord, rowNumber: number, type: InvalidationType) {
    this.record = record
    this.rowNumber = rowNumber
    this.message = `Current and Final Grade mismatch: ${record.STUDENT} (${record['SIS LOGIN ID']})`
    this.type = type
  }
}

class CurrentAndFinalGradeMismatchError extends CurrentAndFinalGradeInvalidation {
  constructor (record: GradebookRecord, rowNumber: number) {
    super(record, rowNumber, InvalidationType.Error)
  }
}

class CurrentAndFinalGradeMismatchWarning extends CurrentAndFinalGradeInvalidation {
  constructor (record: GradebookRecord, rowNumber: number) {
    super(record, rowNumber, InvalidationType.Warning)
  }
}

interface GradebookRecordValidator {
  validate: (record: GradebookRecord, rowNumber: number) => GradebookRowInvalidation[]
}
abstract class GradebookValidator implements GradebookRecordValidator {
  abstract validate: (record: GradebookRecord, rowNumber: number) => GradebookRowInvalidation[]
}
class CurrentAndFinalGradeMatchGradebookValidator extends GradebookValidator {
  validate = (record: GradebookRecord, rowNumber: number): GradebookRowInvalidation[] => {
    const invalidations: GradebookRowInvalidation[] = []
    if (record['FINAL GRADE'] !== record['CURRENT GRADE']) {
      if (record['OVERRIDE GRADE'] === undefined) {
        invalidations.push(new CurrentAndFinalGradeMismatchError(record, rowNumber))
      } else {
        invalidations.push(new CurrentAndFinalGradeMismatchWarning(record, rowNumber))
      }
    }
    return invalidations
  }
}

export type { GradebookRowInvalidation, GradebookRecordValidator }
export {
  CurrentAndFinalGradeMismatchError, CurrentAndFinalGradeMismatchWarning, GradebookValidator,
  CurrentAndFinalGradeMatchGradebookValidator
}
