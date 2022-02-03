const CSV_LINK_DOWNLOAD_PREFIX = 'data:text/csv;charset=utf-8,'

const prepDownloadDataString = (data: string): string => {
  return CSV_LINK_DOWNLOAD_PREFIX + encodeURIComponent(data)
}

/*
Takes a file name and replaces the string segment without a period
just before the file name extension with that segment plus a new provided ending.
Examples:
  createOutputFileName('old-file-name.csv', '-puff') returns 'old-file-name-puff.csv'
  createOutputFileName('old-file-name', '-puff') returns 'old-file-name-puff
  createOutputFileName('old.file.name.csv', '-puff') returns 'old.file.name-puff.csv'
*/
function createOutputFileName (oldFileName: string, newfileEnding: string): string {
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
