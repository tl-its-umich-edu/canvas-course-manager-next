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

  init = async (): Promise<void> => {
    if (this.preload !== undefined) {
      return await this.searchImpl(this.preload)
    } else {
      this.setSections([])
    }
  }

  search = async (searchString: string): Promise<void> => {
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

    this.setSections(await searchSections(this.courseId, 'uniqname', searchText))
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

    this.setSections(await searchSections(this.courseId, 'coursename', searchText))
  }
}

export class SectionNameSearcher extends SectionSearcher {
  constructor (courseId: number, setSectionsCallabck: (sections: CanvasCourseSection[]) => void) {
    super(courseId, 'Section Name', '', setSectionsCallabck)
  }

  searchImpl = async (searchText: string): Promise<void> => {
    const sections = await (await getTeacherSections(this.courseId)).filter(s => { return localeIncludes(s.name, searchText) })
    this.setSections(sections)
  }
}
