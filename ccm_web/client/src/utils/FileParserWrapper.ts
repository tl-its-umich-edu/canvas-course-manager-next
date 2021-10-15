import Papa from 'papaparse'

export type UnknownCSVRecord = Record<string, string | undefined>

export class FileParserWrapper {
  parseConfig?: Papa.ParseConfig
  unparseConfig?: Papa.UnparseConfig

  static defaultParseConfigOptions: Papa.ParseConfig = {
    header: true,
    skipEmptyLines: true
  }

  constructor (parseConfig?: Papa.ParseConfig, unparseConfig?: Papa.UnparseConfig) {
    this.parseConfig = parseConfig !== undefined
      ? parseConfig
      : FileParserWrapper.defaultParseConfigOptions
    this.unparseConfig = unparseConfig !== undefined ? unparseConfig : undefined
  }

  parseCSV (
    file: File,
    onComplete: (headers: string[] | undefined, rowData: UnknownCSVRecord[]) => void,
    onError: (e: Error) => void
  ): void {
    Papa.parse<UnknownCSVRecord>(file, {
      ...this.parseConfig,
      complete: results => onComplete(results.meta.fields, results.data),
      error: (e) => onError(new Error(e.message))
    })
  }

  createCSV (data: Array<Record<string, unknown>> | string[][]): string {
    return Papa.unparse(data, this.unparseConfig)
  }
}
