function createOutputFileName (file: File, newfileEnding: string): string {
  const splitName = file.name.split('.')
  const filenameIndex = splitName.length >= 2 ? splitName.length - 2 : 0
  splitName[filenameIndex] = splitName[filenameIndex] + newfileEnding
  return splitName.join('.')
}

export { createOutputFileName }
