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
class CurrentAndFinalGradeMismatchError implements GradebookRowInvalidation {
  message: string
  record: GradebookRecord
  rowNumber: number
  type: GradbookRowInvalidationType = GradbookRowInvalidationType.ERROR
  constructor (record: GradebookRecord, rowNumber: number) {
    this.record = record
    this.rowNumber = rowNumber
    this.message = 'Current and Final grade mismatch: ' + record.Student + '(' + record['SIS Login ID'] + ')'
  }
}

class CurrentAndFinalGradeMismatchWarning implements GradebookRowInvalidation {
  message: string
  record: GradebookRecord
  rowNumber: number
  type: GradbookRowInvalidationType = GradbookRowInvalidationType.WARNING
  constructor (record: GradebookRecord, rowNumber: number) {
    this.record = record
    this.rowNumber = rowNumber
    this.message = 'Current and Final grade mismatch: ' + record.Student + '(' + record['SIS Login ID'] + ')'
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
