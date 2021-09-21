import { getTeacherSections, searchSections } from '../api'
import { CanvasCourseSection } from '../models/canvas'
import { ISectionSearcher } from '../pages/MergeSections'
import { localeIncludes } from './localeIncludes'

export abstract class SectionSearcher implements ISectionSearcher {
  name: string
  preload: string | undefined
  courseId: number
  setSections: (sections: CanvasCourseSection[]) => void
  constructor (courseId: number, name: string, preload: string | undefined, setSectionsCallabck: (sections: CanvasCourseSection[]) => void) {
    this.courseId = courseId
    this.name = name
    this.preload = preload
    this.setSections = setSectionsCallabck
  }

  abstract searchImpl: (searchText: string) => Promise<void>

  search = async (searchString: string): Promise<void> => {
    console.log(`${this.name} search '${searchString}'`)
    return await this.searchImpl(searchString)
  }
}

export class UniqnameSearcher extends SectionSearcher {
  constructor (courseId: number, setSectionsCallabck: (sections: CanvasCourseSection[]) => void) {
    super(courseId, 'Uniqname', undefined, setSectionsCallabck)
  }

  searchImpl = async (searchText: string): Promise<void> => {
    if (searchText === undefined) {
      return
    }
    searchSections(this.courseId, 'uniqname', searchText).then(sections => {
      this.setSections(sections)
    }).catch(error => {
      throw error
    })
  }
}

export class CourseNameSearcher extends SectionSearcher {
  constructor (courseId: number, setSectionsCallabck: (sections: CanvasCourseSection[]) => void) {
    super(courseId, 'Course Name', undefined, setSectionsCallabck)
  }

  searchImpl = async (searchText: string): Promise<void> => {
    if (searchText === undefined) {
      return
    }
    searchSections(this.courseId, 'coursename', searchText).then(sections => {
      this.setSections(sections)
    }).catch(error => {
      throw error
    })
  }
}

export class SectionNameSearcher extends SectionSearcher {
  constructor (courseId: number, setSectionsCallabck: (sections: CanvasCourseSection[]) => void) {
    super(courseId, 'Section Name', '', setSectionsCallabck)
  }

  searchImpl = async (searchText: string): Promise<void> => {
    getTeacherSections(this.courseId).then(sections => {
      this.setSections(sections.filter(s => { return localeIncludes(s.name, searchText) }))
    }).catch(error => {
      console.log(error)
    })
  }
}
