import Papa from 'papaparse'

export type UnknownCSVRecord = Record<string, string | undefined>

export class FileParserAdapter {
  onComplete: (headers: string[] | undefined, rowData: UnknownCSVRecord[]) => void
  onError: (e: Error) => void

  constructor (
    onComplete: (headers: string[] | undefined, rowData: UnknownCSVRecord[]) => void,
    onError: (e: Error) => void
  ) {
    this.onComplete = onComplete
    this.onError = onError
  }

  parseFile (file: File): void {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: results => this.onComplete(results.meta.fields, results.data),
      error: (e) => this.onError(new Error(e.message))
    })
  }
}
