import { getCourseSections } from '../api'
import { CanvasCourseSection } from '../models/canvas'
import { Course } from '../models/models'

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

export class CanvaCoursesSectionNameValidator {
  course: Course
  _this = this
  validators: IValidator[] = [new DuplicateSectionNameValidator()]

  constructor (course: Course) {
    this.course = course
  }

  private async getSections (): Promise<CanvasCourseSection[]> {
    let sections: CanvasCourseSection[] = []
    await getCourseSections(this.course.id).then(s => {
      sections = s
    }).catch(error => {
      throw new Error(error)
    })
    return sections
  }

  public async validateSectionName (newName: string): Promise<ICanvasSectionNameInvalidError[]> {
    const errors: ICanvasSectionNameInvalidError[] = []
    let sections: CanvasCourseSection[] = []
    await this.getSections().then(s => {
      sections = s
    })
    this.validators.forEach(validator => {
      const error = validator.validate(sections, newName)
      if (error !== undefined) {
        errors.push(error)
      }
    })
    return errors
  }
}
