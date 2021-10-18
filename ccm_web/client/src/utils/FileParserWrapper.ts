import Papa from 'papaparse'

export type UnknownCSVRecord = Record<string, string | undefined>

export default class FileParserWrapper {
  parseConfig?: Papa.ParseConfig
  unparseConfig?: Papa.UnparseConfig

  static defaultParseConfigOptions: Papa.ParseConfig = {
    header: true,
    skipEmptyLines: true,
    transformHeader: header => header.toUpperCase()
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
    onError: (message: string) => void
  ): void {
    Papa.parse<UnknownCSVRecord>(file, {
      ...this.parseConfig,
      complete: results => onComplete(results.meta.fields, results.data),
      error: (e) => onError(`An error occurred while parsing the file: "${e.message}"`)
    })
  }

  createCSV (data: Array<Record<string, unknown>> | string[][]): string {
    return Papa.unparse(data, this.unparseConfig)
  }
}
