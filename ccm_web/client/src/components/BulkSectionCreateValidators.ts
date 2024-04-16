import { InvalidationType } from '../models/models.js'
import { DuplicateIdentifierInRowsValidator, RowInvalidation, StringRowsSchemaValidator } from '../utils/rowValidation.js'
import { sectionNameSchema } from '../utils/validation.js'

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
    const sectionNameValidator = new StringRowsSchemaValidator(sectionNameSchema, 'section name')
    return sectionNameValidator.validate(sectionNames)
  }
}

export type { SectionsRowInvalidation, SectionRowsValidator }
export { InvalidationType, DuplicateSectionInFileSectionRowsValidator, SectionNameLengthValidator }
