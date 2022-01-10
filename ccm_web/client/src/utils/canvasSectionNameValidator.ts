import { sectionNameSchema, validateString } from './validation'
import { getCourseSections } from '../api'
import { CanvasCourseSection } from '../models/canvas'

export interface ICanvasSectionNameInvalidError {
  reason: string
}

interface IValidator {
  validate: (sections: CanvasCourseSection[], sectionName: string) => ICanvasSectionNameInvalidError|undefined
}

class DuplicateSectionNameValidator implements IValidator {
  validate = (sections: CanvasCourseSection[], sectionName: string): ICanvasSectionNameInvalidError | undefined => {
    if (sections.map(s => s.name).filter(n => n.localeCompare(sectionName) === 0).length > 0) {
      return { reason: `Section name already used in this course: "${sectionName}"` }
    }
    return undefined
  }
}

class SectionNameLengthValidator implements IValidator {
  validate = (sections: CanvasCourseSection[], sectionName: string): ICanvasSectionNameInvalidError | undefined => {
    const result = validateString(sectionName, sectionNameSchema)
    if (!result.isValid) {
      return { reason: result.messages.length > 0 ? result.messages[0] : 'The section name is invalid.' }
    }
    return undefined
  }
}

export class CanvasCoursesSectionNameValidator {
  courseId: number
  _this = this
  validators: IValidator[] = [new DuplicateSectionNameValidator(), new SectionNameLengthValidator()]

  constructor (courseId: number) {
    this.courseId = courseId
  }

  public async validateSectionName (newName: string): Promise<ICanvasSectionNameInvalidError[]> {
    const errors: ICanvasSectionNameInvalidError[] = []
    const sections = await getCourseSections(this.courseId)
    this.validators.forEach(validator => {
      const error = validator.validate(sections, newName)
      if (error !== undefined) {
        errors.push(error)
      }
    })
    return errors
  }
}
