import { GradebookRecord } from '../pages/GradebookCanvas'

enum GradbookRowInvalidationType {
  ERROR,
  WARNING
}

interface GradebookRowInvalidation {
  message: string
  rowNumber: number
  type: GradbookRowInvalidationType
}

class CurrentAndFinalGradeInvalidation implements GradebookRowInvalidation {
  message: string
  record: GradebookRecord
  rowNumber: number
  type: GradbookRowInvalidationType
  constructor (record: GradebookRecord, rowNumber: number, type: GradbookRowInvalidationType) {
    this.record = record
    this.rowNumber = rowNumber
    this.message = 'Current and Final grade mismatch: ' + record.Student + '(' + record['SIS Login ID'] + ')'
    this.type = type
  }
}

class CurrentAndFinalGradeMismatchError extends CurrentAndFinalGradeInvalidation {
  constructor (record: GradebookRecord, rowNumber: number, isError: boolean) {
    super(record, rowNumber, GradbookRowInvalidationType.ERROR)
  }
}

class CurrentAndFinalGradeMismatchWarning extends CurrentAndFinalGradeInvalidation {
  constructor (record: GradebookRecord, rowNumber: number, isError: boolean) {
    super(record, rowNumber, GradbookRowInvalidationType.WARNING)
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
    if (record['Final Grade'] !== record['Current Grade']) {
      if (record['Override Grade'] === undefined) {
        invalidations.push(new CurrentAndFinalGradeMismatchError(record, rowNumber))
      } else {
        invalidations.push(new CurrentAndFinalGradeMismatchWarning(record, rowNumber))
      }
    }
    return invalidations
  }
}

export type { GradebookRowInvalidation, GradebookRecordValidator }
export { CurrentAndFinalGradeMismatchError, CurrentAndFinalGradeMismatchWarning, GradebookValidator, CurrentAndFinalGradeMatchGradebookValidator, GradbookRowInvalidationType }
