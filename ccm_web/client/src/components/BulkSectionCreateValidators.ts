import { InvalidationType } from '../models/models'
import { sectionNameSchema, validateString } from '../utils/validation'

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

class SectionNameLengthValidator implements SectionRowsValidator {
  validate = (sectionNames: string[]): SectionsRowInvalidation[] => {
    const invalidations: SectionsRowInvalidation[] = []
    sectionNames.forEach((sectionName, row) => {
      const result = validateString(sectionName, sectionNameSchema)
      if (!result.isValid) {
        invalidations.push({
          message: result.messages.length > 0 ? result.messages[0] : 'Section name is invalid.',
          rowNumber: row + 2,
          type: InvalidationType.Error
        })
      }
    })
    return invalidations
  }
}

export type { SectionsRowInvalidation, SectionRowsValidator }
export { InvalidationType, DuplicateSectionInFileSectionRowsValidator, SectionNameLengthValidator }
