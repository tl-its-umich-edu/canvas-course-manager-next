import { InvalidationType } from '../models/models'
import { CSVRecord } from '../utils/FileParserWrapper'

interface SchemaInvalidation {
  message: string
  type: InvalidationType
}

// For validating schema level problems
interface ICSVSchemaValidator<T extends CSVRecord> {
  requiredHeaders: string[]
  typeGuard: (r: CSVRecord) => r is T
  maxLength: number | undefined
  validateHeaders: (headers: string[]) => SchemaInvalidation | undefined
  validateLength: (rowData: CSVRecord[]) => SchemaInvalidation | undefined
  validate: (headers: string[], rowData: CSVRecord[]) => SchemaInvalidation[]
}

class CSVSchemaValidator<T extends CSVRecord> implements ICSVSchemaValidator<T> {
  typeGuard: (r: CSVRecord) => r is T
  requiredHeaders: string[]
  maxLength: number | undefined

  static recordShapeInvalidation: SchemaInvalidation = {
    message: 'Some of the required columns in the CSV are missing data.',
    type: InvalidationType.Error
  }

  constructor (requiredHeaders: string[], typeGuard: (r: CSVRecord) => r is T, maxLength?: number) {
    this.maxLength = maxLength
    this.typeGuard = typeGuard
    this.requiredHeaders = requiredHeaders
  }

  validateHeaders (headers: string[] | undefined): SchemaInvalidation | undefined {
    const invalidation = {
      message: (
        'The headers are invalid. The first line must include the following headers: ' +
        this.requiredHeaders.map(h => `"${h}"`).join(', ')
      ),
      type: InvalidationType.Error
    }
    if (headers === undefined) return invalidation
    const result = this.requiredHeaders.every(v => headers.includes(v))
    if (!result) return invalidation
  }

  validateLength (rowData: CSVRecord[]): SchemaInvalidation | undefined {
    if (rowData.length === 0) {
      return { message: 'No data was found in the file.', type: InvalidationType.Error }
    }
    if (this.maxLength !== undefined && rowData.length > this.maxLength) {
      return {
        message: `The CSV file has too many records. The maximum number of non-header records allowed is ${this.maxLength}.`,
        type: InvalidationType.Error
      }
    }
  }

  validate (headers: string[] | undefined, rowData: CSVRecord[]): SchemaInvalidation[] {
    const schemaInvalidations = []
    const headersResult = this.validateHeaders(headers)
    if (headersResult !== undefined) schemaInvalidations.push(headersResult)
    const lengthResult = this.validateLength(rowData)
    if (lengthResult !== undefined) schemaInvalidations.push(lengthResult)
    return schemaInvalidations
  }

  checkRecordShapes (rowData: CSVRecord[]): rowData is T[] {
    return rowData.every(r => this.typeGuard(r))
  }
}

export type { SchemaInvalidation }
export default CSVSchemaValidator
