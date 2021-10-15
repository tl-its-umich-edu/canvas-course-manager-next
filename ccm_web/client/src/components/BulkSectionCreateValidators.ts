export const FILE_HEADER_VALUE = 'SECTION_NAME'

const isHeader = (text: string): boolean => {
  return text.toUpperCase() === FILE_HEADER_VALUE.toUpperCase()
}

const hasHeader = (sectionNames: string[]): boolean => {
  return sectionNames.length > 0 && isHeader(sectionNames[0])
}

// Original requirement was to have a warning for missing header row, leaving this for now
enum InvalidationType {
  Error,
  Warning
}

interface SectionsSchemaInvalidation {
  error: string
  type: InvalidationType
}

// For validating schema level problems
interface SectionsSchemaValidator {
  validate: (sectionName: string[]) => SectionsSchemaInvalidation[]
}

class SectionNameHeaderValidator implements SectionsSchemaValidator {
  validate = (sectionNames: string[]): SectionsSchemaInvalidation[] => {
    const invalidations: SectionsSchemaInvalidation[] = []

    if (!hasHeader(sectionNames)) {
      invalidations.push({ error: 'First line must be "' + FILE_HEADER_VALUE + '"', type: InvalidationType.Error })
    }
    if (sectionNames.length === 0) {
      invalidations.push({ error: 'No data found', type: InvalidationType.Error })
    }

    if (sectionNames.length === 1 && isHeader(sectionNames[0])) {
      invalidations.push({ error: 'No data found', type: InvalidationType.Error })
    }
    return invalidations
  }
}

// For validating row level issues
interface SectionsRowInvalidation {
  message: string
  rowNumber: number
  type: InvalidationType
}

interface SectionRowsValidator {
  validate: (sectionName: string[]) => SectionsRowInvalidation[]
}

class DuplicateSectionInFileSectionRowsValidator implements SectionRowsValidator {
  validate = (sectionNames: string[]): SectionsRowInvalidation[] => {
    const sortedSectionNames = sectionNames.map(n => { return n.toUpperCase() }).sort((a, b) => { return a.localeCompare(b) })
    const duplicates: string[] = []
    for (let i = 1; i < sortedSectionNames.length; ++i) {
      if (sortedSectionNames[i - 1] === sortedSectionNames[i] && !duplicates.includes(sortedSectionNames[i])) {
        duplicates.push(sortedSectionNames[i])
      }
    }
    if (duplicates.length === 0) {
      return []
    }
    const invalidations: SectionsRowInvalidation[] = []
    let i = 1
    sectionNames.forEach(sectionName => {
      if (duplicates.includes(sectionName.toUpperCase())) {
        invalidations.push({ message: 'Duplicate section name found in this file: "' + sectionName + '"', rowNumber: i + 1, type: InvalidationType.Error })
      }
      ++i
    })
    return invalidations
  }
}

class EmptySectionNameValidator implements SectionRowsValidator {
  validate = (sectionNames: string[]): SectionsRowInvalidation[] => {
    const invalidations: SectionsRowInvalidation[] = []
    sectionNames.forEach((sectionName, row) => {
      if (sectionName.trim().length === 0) {
        invalidations.push({ message: 'Empty section name\'s not allowed', rowNumber: row + 2, type: InvalidationType.Error })
      }
    })
    return invalidations
  }
}

class SectionNameTooLongValidator implements SectionRowsValidator {
  validate = (sectionNames: string[]): SectionsRowInvalidation[] => {
    const invalidations: SectionsRowInvalidation[] = []
    sectionNames.forEach((sectionName, row) => {
      if (sectionName.trim().length > 255) {
        invalidations.push({ message: 'Section name must be 255 characters or less', rowNumber: row + 2, type: InvalidationType.Error })
      }
    })
    return invalidations
  }
}

export type { SectionsSchemaInvalidation, SectionsRowInvalidation, SectionRowsValidator, SectionsSchemaValidator }
export { InvalidationType, SectionNameHeaderValidator, DuplicateSectionInFileSectionRowsValidator, EmptySectionNameValidator, SectionNameTooLongValidator, hasHeader }
