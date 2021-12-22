import { InvalidationType } from '../models/models'
import { DuplicateIdentifierInRowsValidator, RowInvalidation } from '../utils/rowValidation'
import { sectionNameSchema, validateString } from '../utils/validation'

interface SectionsRowInvalidation extends RowInvalidation {}

interface SectionRowsValidator {
  validate: (sectionName: string[]) => SectionsRowInvalidation[]
}

class DuplicateSectionInFileSectionRowsValidator implements SectionRowsValidator {
  validate = (sectionNames: string[]): SectionsRowInvalidation[] => {
    const dupNameValidator = new DuplicateIdentifierInRowsValidator('section name')
    return dupNameValidator.validate(sectionNames)
  }
}

class SectionNameLengthValidator implements SectionRowsValidator {
  validate = (sectionNames: string[]): SectionsRowInvalidation[] => {
    const invalidations: SectionsRowInvalidation[] = []
    sectionNames.forEach((sectionName, row) => {
      const result = validateString(sectionName, sectionNameSchema)
      if (!result.isValid) {
        invalidations.push({
          message: result.messages.length > 0 ? result.messages[0] : 'Value for the section name is invalid.',
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
