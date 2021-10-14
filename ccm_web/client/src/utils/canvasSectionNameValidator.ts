import { getCourseSections } from '../api'
import { CanvasCourseSectionWithCourseName } from '../models/canvas'
import { Course } from '../models/models'

export interface ICanvasSectionNameInvalidError {
  reason: string
}

interface IValidator {
  validate: (sections: CanvasCourseSectionWithCourseName[], sectionName: string) => ICanvasSectionNameInvalidError|undefined
}

class DuplicateSectionNameValidator implements IValidator {
  validate = (sections: CanvasCourseSectionWithCourseName[], sectionName: string): ICanvasSectionNameInvalidError | undefined => {
    if (sections.map(s => s.name).filter(n => n.localeCompare(sectionName) === 0).length > 0) {
      return { reason: `Section name already used in this course: "${sectionName}"` }
    }
    return undefined
  }
}

class SectionNameTooLongValidator implements IValidator {
  validate = (sections: CanvasCourseSectionWithCourseName[], sectionName: string): ICanvasSectionNameInvalidError | undefined => {
    if (sectionName.length > 255) {
      return { reason: 'Section name must be 255 characters or less' }
    }
    return undefined
  }
}

export class CanvasCoursesSectionNameValidator {
  course: Course
  _this = this
  validators: IValidator[] = [new DuplicateSectionNameValidator(), new SectionNameTooLongValidator()]

  constructor (course: Course) {
    this.course = course
  }

  public async validateSectionName (newName: string): Promise<ICanvasSectionNameInvalidError[]> {
    const errors: ICanvasSectionNameInvalidError[] = []
    const sections = await getCourseSections(this.course.id)
    this.validators.forEach(validator => {
      const error = validator.validate(sections, newName)
      if (error !== undefined) {
        errors.push(error)
      }
    })
    return errors
  }
}
