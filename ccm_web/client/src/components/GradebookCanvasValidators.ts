import { GradebookRecord } from '../pages/GradebookCanvas'

interface GradebookRowInvalidation {
  message: string
  rowNumber: number
}
class CurrentAndFinalGradeMismatchInvalidation implements GradebookRowInvalidation {
  message: string
  record: GradebookRecord
  rowNumber: number
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
      invalidations.push(new CurrentAndFinalGradeMismatchInvalidation(record, rowNumber))
    }
    return invalidations
  }
}

export type { GradebookRowInvalidation, GradebookRecordValidator }
export { CurrentAndFinalGradeMismatchInvalidation, GradebookValidator, CurrentAndFinalGradeMatchGradebookValidator }
