import { getTeacherSections, searchSections } from '../api'
import { CanvasCourseSection, CourseWithSections } from '../models/canvas'
import { ISectionSearcher } from '../pages/MergeSections'
import { localeIncludes } from './localeIncludes'

export abstract class SectionSearcher implements ISectionSearcher {
  name: string
  helperText: string
  preload: string | undefined
  termId: number
  courseId: number
  setSections: (sections: CanvasCourseSection[]) => void
  updateTitleCallback: (title: string) => void
  constructor (termId: number, courseId: number, name: string, helperText: string, preload: string | undefined, setSectionsCallabck: (sections: CanvasCourseSection[]) => void, updateTitle: (title: string) => void) {
    this.termId = termId
    this.courseId = courseId
    this.name = name
    this.helperText = helperText
    this.preload = preload
    this.setSections = setSectionsCallabck
    this.updateTitleCallback = updateTitle
  }

  abstract resetTitle: () => void

  abstract searchImpl: (searchText: string) => Promise<CanvasCourseSection[]>

  init = async (): Promise<void> => {
    if (this.preload !== undefined) {
      await this.search(this.preload, false)
    } else {
      this.setSections([])
    }
  }

  search = async (searchString: string, updateTitle = true): Promise<void> => {
    if (searchString === undefined) {
      return
    }
    if (updateTitle) this.updateTitleCallback('Searching...')
    this.setSections([])
    const filteredSections = (await this.searchImpl(searchString)).filter(section => { return section.course_id !== this.courseId && section.nonxlist_course_id !== this.courseId })
    if (updateTitle) this.updateTitleCallback(`Search results (${filteredSections.length})`)
    this.setSections(filteredSections)
  }
}

export class UniqnameSearcher extends SectionSearcher {
  constructor (termId: number, courseId: number, setSectionsCallabck: (sections: CanvasCourseSection[]) => void, updateTitle: (title: string) => void) {
    super(termId, courseId, 'Uniqname', 'Search by exact Instructor Uniqname', undefined, setSectionsCallabck, updateTitle)
  }

  resetTitle = (): void => {
    this.updateTitleCallback('Sections for Uniqname')
  }

  searchImpl = async (searchText: string): Promise<CanvasCourseSection[]> => {
    return coursesWithSectionsToCanvasCourseSections(await searchSections(this.termId, 'uniqname', searchText))
  }
}

export class CourseNameSearcher extends SectionSearcher {
  constructor (termId: number, courseId: number, setSectionsCallabck: (sections: CanvasCourseSection[]) => void, updateTitle: (title: string) => void) {
    super(termId, courseId, 'Course Name', 'Search by course name', undefined, setSectionsCallabck, updateTitle)
  }

  resetTitle = (): void => {
    this.updateTitleCallback('Sections for course name')
  }

  searchImpl = async (searchText: string): Promise<CanvasCourseSection[]> => {
    return coursesWithSectionsToCanvasCourseSections(await searchSections(this.termId, 'coursename', searchText))
  }
}

export class SectionNameSearcher extends SectionSearcher {
  constructor (termId: number, courseId: number, setSectionsCallabck: (sections: CanvasCourseSection[]) => void, updateTitle: (title: string) => void) {
    super(termId, courseId, 'Section Name', 'Search by section name', '', setSectionsCallabck, updateTitle)
  }

  sectionsCache: CourseWithSections[] | undefined = undefined

  resetTitle = (): void => {
    this.updateTitleCallback('Sections I Teach')
  }

  getCachedTeacherSections = async (): Promise<CourseWithSections[]> => {
    if (this.sectionsCache === undefined) {
      this.sectionsCache = await getTeacherSections(this.termId)
    }
    return this.sectionsCache
  }

  searchImpl = async (searchText: string): Promise<CanvasCourseSection[]> => {
    return coursesWithSectionsToCanvasCourseSections(await this.getCachedTeacherSections()).filter(s => { return localeIncludes(s.name, searchText) })
  }
}

const coursesWithSectionsToCanvasCourseSections = (coursesWithSections: CourseWithSections[]): CanvasCourseSection[] => {
  return coursesWithSections.map(courseWithSections => {
    return courseWithSections.sections.map(section => { return { ...section, course_name: courseWithSections.name } })
  }).flat()
}
