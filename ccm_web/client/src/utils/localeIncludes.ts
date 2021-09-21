// Tweaked from https://www.npmjs.com/package/locale-includes
export const localeIncludes = (string: string, searchString: string): boolean => {
  if (string === undefined ||
      string === null ||
      searchString === undefined ||
      searchString === null
  ) {
    throw new Error('localeIncludes requires at least 2 parameters')
  }

  const stringLength = string.length
  const searchStringLength = searchString.length
  const lengthDiff = stringLength - searchStringLength

  for (let i = 0; i <= lengthDiff; i++) {
    if (string.substring(i, i + searchStringLength).localeCompare(searchString, 'en', { sensitivity: 'base' }) === 0) {
      return true
    }
  }

  return false
}
