import { UnknownCSVRecord } from '../utils/FileParserAdapter'

// Original requirement was to have a warning for missing header row, leaving this for now
enum InvalidationType {
  Error,
  Warning
}

interface SchemaInvalidation {
  error: string
  type: InvalidationType
}

// For validating schema level problems
interface ICSVSchemaValidator<T extends UnknownCSVRecord> {
  requiredHeaders: string[]
  typeGuard: (r: UnknownCSVRecord) => r is T
  maxLength: number | undefined
  validateHeaders: (headers: string[]) => SchemaInvalidation | undefined
  validateLength: (rowData: UnknownCSVRecord[]) => SchemaInvalidation | undefined
  validate: (headers: string[], rowData: UnknownCSVRecord[]) => SchemaInvalidation[]
}

class CSVSchemaValidator<T extends UnknownCSVRecord> implements ICSVSchemaValidator<T> {
  typeGuard: (r: UnknownCSVRecord) => r is T
  requiredHeaders: string[]
  maxLength: number | undefined

  static recordShapeInvalidation: SchemaInvalidation = {
    error: 'One or more of the records in your file has incorrect types.',
    type: InvalidationType.Error
  }

  constructor (requiredHeaders: string[], typeGuard: (r: UnknownCSVRecord) => r is T, maxLength?: number) {
    this.maxLength = maxLength
    this.typeGuard = typeGuard
    this.requiredHeaders = requiredHeaders
  }

  validateHeaders (headers: string[] | undefined): SchemaInvalidation | undefined {
    const invalidation = {
      error: (
        'The headers are invalid. The first line must include the following headers: ' +
        this.requiredHeaders.map(h => `"${h}"`).join(', ')
      ),
      type: InvalidationType.Error
    }
    if (headers === undefined) return invalidation
    const result = this.requiredHeaders.every(v => headers.includes(v))
    if (!result) return invalidation
  }

  validateLength (rowData: UnknownCSVRecord[]): SchemaInvalidation | undefined {
    if (rowData.length === 0) {
      return { error: 'No data found', type: InvalidationType.Error }
    }
    if (this.maxLength !== undefined && rowData.length > this.maxLength) {
      return {
        error: `The CSV file has too many records. The maximum number of non-header records allowed is ${this.maxLength}.`,
        type: InvalidationType.Error
      }
    }
  }

  validate (headers: string[] | undefined, rowData: UnknownCSVRecord[]): SchemaInvalidation[] {
    const schemaInvalidations = []
    const headersResult = this.validateHeaders(headers)
    if (headersResult !== undefined) schemaInvalidations.push(headersResult)
    const lengthResult = this.validateLength(rowData)
    if (lengthResult !== undefined) schemaInvalidations.push(lengthResult)
    return schemaInvalidations
  }

  checkRecordShapes (rowData: UnknownCSVRecord[]): rowData is T[] {
    console.log(rowData.map(r => ({
      'Final Grade': r['Final Grade'],
      'Current Grade': r['Current Grade'],
      Student: r.Student,
      'SIS Login ID': r['SIS Login ID']
    })))
    return rowData.every(r => this.typeGuard(r))
  }
}

export type { SchemaInvalidation }
export { CSVSchemaValidator as default, InvalidationType }
