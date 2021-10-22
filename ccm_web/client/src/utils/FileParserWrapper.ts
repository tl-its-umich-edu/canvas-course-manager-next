import Papa from 'papaparse'

/*
Though papaparse lets you pass an expected return type (see FileParserWrapper.parseCSV below),
the type seems to be simply a hint; no validation is performed. However, it seems reasonable
to expect based on the parsing behavior that all resulting objects will have this general type.
*/
export type CSVRecord = Record<string, string | undefined>

/*
Basic wrapper for CSV parsing library in use (currently papaparse)
Docs: https://www.papaparse.com/docs

The logic defaults to the defaultParseConfigOptions for parseConfig and undefined for unparseConfig
(which we use throughout the application) but the class accepts the library's config options
to allow for testing and additional case-by-case customization.
*/
export default class FileParserWrapper {
  parseConfig?: Papa.ParseConfig
  unparseConfig?: Papa.UnparseConfig

  static defaultParseConfigOptions: Papa.ParseConfig = {
    header: true,
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
    onComplete: (headers: string[] | undefined, rowData: CSVRecord[]) => void,
    onError: (message: string) => void
  ): void {
    file.text().then(
      (v) => {
        const results = Papa.parse<CSVRecord>(v.trim(), this.parseConfig)
        onComplete(results.meta.fields, results.data)
      }
    ).catch(
      (r) => onError(`An error occurred while parsing the file: "${String(r)}"`)
    )
  }

  createCSV (data: Array<Record<string, unknown>> | string[][]): string {
    return Papa.unparse(data, this.unparseConfig)
  }
}
