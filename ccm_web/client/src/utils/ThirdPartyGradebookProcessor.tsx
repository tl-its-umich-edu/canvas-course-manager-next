import { CSVRecord } from '../utils/FileParserWrapper'
import { InvalidationType } from '../models/models'

export interface GradebookUploadRecord extends CSVRecord {
  'SIS Login ID': string
}

export const REQUIRED_LOGIN_ID_HEADER = 'SIS Login ID'
const OTHER_REQUIRED_HEADERS = ['Student Name', 'Student ID', 'SIS User ID', 'Section']
export const REQUIRED_ORDERED_HEADERS = [
  ...OTHER_REQUIRED_HEADERS.slice(0, 3), REQUIRED_LOGIN_ID_HEADER, OTHER_REQUIRED_HEADERS[3]
]
export const POINTS_POS_TEXT = 'Points Possible'

export const isGradebookUploadRecord = (record: CSVRecord): record is GradebookUploadRecord => {
  return typeof record[REQUIRED_LOGIN_ID_HEADER] === 'string'
}

export interface GradebookInvalidation {
  message: string
  type: InvalidationType
}

interface ProcessResultSuccess {
  valid: true
  processedRecords: GradebookUploadRecord[]
  assignmentHeader: string
  invalidations: GradebookInvalidation[]
}

interface ProcessResultFailure {
  valid: false
  invalidations: GradebookInvalidation[]
}

export type ProcessResult = ProcessResultSuccess | ProcessResultFailure

export default class ThirdPartyGradebookProcessor {
  studentLoginIds: string[]

  constructor (studentLoginIds: string[]) {
    this.studentLoginIds = studentLoginIds
  }

  static detectPointsPossible (firstRecord: GradebookUploadRecord): GradebookInvalidation | undefined {
    if (!Object.values(firstRecord).includes(POINTS_POS_TEXT)) {
      return {
        message: `The file you uploaded is missing a ${POINTS_POS_TEXT} row.`,
        type: InvalidationType.Error
      }
    }
  }

  static detectAssignment (oneRecord: GradebookUploadRecord): [string, undefined] | [undefined, GradebookInvalidation] {
    const otherKeys = Object.keys(oneRecord).filter(k => !REQUIRED_ORDERED_HEADERS.includes(k))
    if (otherKeys.length === 1) return [otherKeys[0], undefined]
    let message: string | undefined
    if (otherKeys.length === 0) {
      message = 'No assignment column was found.'
    } else {
      message = 'Multiple assignment columns were found; only one assignment column at a time is supported.'
    }
    return [undefined, { message, type: InvalidationType.Error }]
  }

  static addEmptyPropertyToData (data: GradebookUploadRecord[], newHeader: string): GradebookUploadRecord[] {
    return data.map(r => {
      const newObj = { ...r }
      if (!Object.keys(newObj).includes(newHeader)) {
        newObj[newHeader] = ''
      }
      return newObj
    })
  }

  static addRequiredCanvasHeaders (records: GradebookUploadRecord[]): GradebookUploadRecord[] {
    let updatedRecords = records
    for (const header of OTHER_REQUIRED_HEADERS) {
      updatedRecords = ThirdPartyGradebookProcessor.addEmptyPropertyToData(updatedRecords, header)
    }
    return updatedRecords
  }

  process (uploadRecords: GradebookUploadRecord[]): ProcessResult {
    const filteredRecords: GradebookUploadRecord[] = []
    const studentsWithoutRecords: string[] = []
    const invalidations: GradebookInvalidation[] = []

    const pointsPossibleResult = ThirdPartyGradebookProcessor.detectPointsPossible(uploadRecords[0])
    if (pointsPossibleResult !== undefined) invalidations.push(pointsPossibleResult)

    const [assignmentHeader, assignmentInvalidation] = ThirdPartyGradebookProcessor.detectAssignment(uploadRecords[1])
    if (assignmentInvalidation !== undefined) invalidations.push(assignmentInvalidation)
    // Is there a better way to do this that doesn't require the assignmentHeader assertion?
    if (invalidations.length > 0 || assignmentHeader === undefined) return { valid: false, invalidations }

    const pointsPossibleRecord = uploadRecords[0]
    const recordToFilter = uploadRecords.slice(1)

    for (const loginId of this.studentLoginIds) {
      const filterResult = recordToFilter.filter(r => r[REQUIRED_LOGIN_ID_HEADER] === loginId)
      if (filterResult.length === 1) {
        filteredRecords.push(filterResult[0])
      } else if (filterResult.length > 1) {
        invalidations.push({
          message: `Student with ${REQUIRED_LOGIN_ID_HEADER} ${loginId} found multiple times in file.`,
          type: InvalidationType.Error
        })
      } else {
        studentsWithoutRecords.push(loginId)
      }
    }

    if (studentsWithoutRecords.length > 0) {
      invalidations.push({
        message: (
          'One or more students from the section(s) you selected were not present in the provided file: ' +
            studentsWithoutRecords.join(', ')
        ),
        type: InvalidationType.Warning
      })
    }
    if (filteredRecords.length === 0) {
      invalidations.push({
        message: 'None of the students from the section(s) you selected were present in the provided file.',
        type: InvalidationType.Error
      })
    }

    const errorCount = invalidations.filter(i => i.type === InvalidationType.Error).length
    if (errorCount > 0) {
      return { valid: false, invalidations }
    }

    const newRecords = ThirdPartyGradebookProcessor.addRequiredCanvasHeaders([pointsPossibleRecord].concat(filteredRecords))
    // Move Points Possible
    newRecords[0][REQUIRED_LOGIN_ID_HEADER] = ''
    newRecords[0][REQUIRED_ORDERED_HEADERS[0]] = POINTS_POS_TEXT

    return { valid: true, processedRecords: newRecords, invalidations, assignmentHeader }
  }
}
