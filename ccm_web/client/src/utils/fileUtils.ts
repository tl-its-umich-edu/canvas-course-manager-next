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

export { createOutputFileName }
