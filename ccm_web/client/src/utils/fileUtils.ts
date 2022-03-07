const CSV_LINK_DOWNLOAD_PREFIX = 'data:text/csv;charset=utf-8,'

const prepDownloadDataString = (data: string): string => {
  return CSV_LINK_DOWNLOAD_PREFIX + encodeURIComponent(data)
}

/*
Takes a file name and replaces the string segment without a period
just before the file name extension with that segment plus a new ending
(which can be optionally provided). The default new ending is '-formatted'.
Examples:
  createOutputFileName('old-file-name.csv', '-new') returns 'old-file-name-new.csv'
  createOutputFileName('old-file-name') returns 'old-file-name-formatted
  createOutputFileName('old.file.name.csv', '-alt') returns 'old.file.name-alt.csv'
*/
function createOutputFileName (oldFileName: string, newfileEnding?: string): string {
  if (newfileEnding === undefined) {
    newfileEnding = '-formatted'
  }
  const splitName = oldFileName.split('.')
  const filenameIndex = splitName.length >= 2 ? splitName.length - 2 : 0
  splitName[filenameIndex] = splitName[filenameIndex] + newfileEnding
  return splitName.join('.')
}

// Add 1 to convert to one-based index, then add number of header rows, one being the default
function getRowNumber (index: number, numHeaderRows = 1): number {
  return index + 1 + numHeaderRows
}

export { createOutputFileName, getRowNumber, prepDownloadDataString }
