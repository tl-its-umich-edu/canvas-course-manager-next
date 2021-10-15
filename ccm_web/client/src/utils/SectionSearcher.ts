import { getCourseSections, getTeacherSections, searchSections } from '../api'
import { injectCourseName, CanvasCourseSectionWithCourseName, CourseWithSections } from '../models/canvas'
import { localeIncludes } from './localeIncludes'

export interface ISectionSearcher {
  name: string
  helperText: string
  preload: string | undefined
  search: (searchString: string) => Promise<void>
  updateTitleCallback?: (title: string) => void
  init: () => Promise<void>
  resetTitle?: () => void
  isInteractive: boolean
}

export abstract class SectionSearcher implements ISectionSearcher {
  name: string
  helperText: string
  preload: string | undefined
  termId: number
  courseId: number
  setSections: (sections: CanvasCourseSectionWithCourseName[]) => void
  updateTitleCallback?: (title: string) => void
  isInteractive = true
  searchFilter?: (sections: CanvasCourseSectionWithCourseName[]) => CanvasCourseSectionWithCourseName[]
  constructor (termId: number, courseId: number, name: string, helperText: string, preload: string | undefined, setSectionsCallabck: (sections: CanvasCourseSectionWithCourseName[]) => void, updateTitle?: (title: string) => void) {
    this.termId = termId
    this.courseId = courseId
    this.name = name
    this.helperText = helperText
    this.preload = preload
    this.setSections = setSectionsCallabck
    this.updateTitleCallback = updateTitle
  }

  abstract resetTitle?: () => void

  abstract searchImpl: (searchText: string) => Promise<CanvasCourseSectionWithCourseName[]>

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
    if (updateTitle && this.updateTitleCallback !== undefined) this.updateTitleCallback('Searching...')
    this.setSections([])
    let filteredSections = await this.searchImpl(searchString)
    if (this.searchFilter !== undefined) filteredSections = this.searchFilter(filteredSections)
    if (updateTitle && this.updateTitleCallback !== undefined) this.updateTitleCallback(`Search results (${filteredSections.length})`)
    this.setSections(filteredSections)
  }
}

const sectionNotInOrCrosslistedToCurrentCourseFilter = (sections: CanvasCourseSectionWithCourseName[], currentCourseId: number): CanvasCourseSectionWithCourseName[] => {
  return sections.filter(section => { return section.course_id !== currentCourseId && section.nonxlist_course_id !== currentCourseId })
}

export class UniqnameSearcher extends SectionSearcher {
  constructor (termId: number, courseId: number, setSectionsCallabck: (sections: CanvasCourseSectionWithCourseName[]) => void, updateTitle: (title: string) => void) {
    super(termId, courseId, 'Uniqname', 'Search by exact Instructor Uniqname', undefined, setSectionsCallabck, updateTitle)
    this.searchFilter = this.filter
  }

  filter = (sections: CanvasCourseSectionWithCourseName[]): CanvasCourseSectionWithCourseName[] => {
    return sectionNotInOrCrosslistedToCurrentCourseFilter(sections, this.courseId)
  }

  resetTitle = (): void => {
    if (this.updateTitleCallback !== undefined) this.updateTitleCallback('Sections for Uniqname')
  }

  searchImpl = async (searchText: string): Promise<CanvasCourseSectionWithCourseName[]> => {
    return coursesWithSectionsToCanvasCourseSections(await searchSections(this.termId, 'uniqname', searchText))
  }
}

export class CourseNameSearcher extends SectionSearcher {
  constructor (termId: number, courseId: number, setSectionsCallabck: (sections: CanvasCourseSectionWithCourseName[]) => void, updateTitle: (title: string) => void) {
    super(termId, courseId, 'Course Name', 'Search by course name', undefined, setSectionsCallabck, updateTitle)
    this.searchFilter = this.filter
  }

  filter = (sections: CanvasCourseSectionWithCourseName[]): CanvasCourseSectionWithCourseName[] => {
    return sectionNotInOrCrosslistedToCurrentCourseFilter(sections, this.courseId)
  }

  resetTitle = (): void => {
    if (this.updateTitleCallback !== undefined) this.updateTitleCallback('Sections for course name')
  }

  searchImpl = async (searchText: string): Promise<CanvasCourseSectionWithCourseName[]> => {
    return coursesWithSectionsToCanvasCourseSections(await searchSections(this.termId, 'coursename', searchText))
  }
}

export class SectionNameSearcher extends SectionSearcher {
  constructor (termId: number, courseId: number, setSectionsCallabck: (sections: CanvasCourseSectionWithCourseName[]) => void, updateTitle: (title: string) => void) {
    super(termId, courseId, 'Section Name', 'Search by section name', '', setSectionsCallabck, updateTitle)
    this.searchFilter = this.filter
  }

  filter = (sections: CanvasCourseSectionWithCourseName[]): CanvasCourseSectionWithCourseName[] => {
    return sectionNotInOrCrosslistedToCurrentCourseFilter(sections, this.courseId)
  }

  sectionsCache: CourseWithSections[] | undefined = undefined

  resetTitle = (): void => {
    if (this.updateTitleCallback !== undefined) this.updateTitleCallback('Sections I Teach')
  }

  getCachedTeacherSections = async (): Promise<CourseWithSections[]> => {
    if (this.sectionsCache === undefined) {
      this.sectionsCache = await getTeacherSections(this.termId)
    }
    return this.sectionsCache
  }

  searchImpl = async (searchText: string): Promise<CanvasCourseSectionWithCourseName[]> => {
    return coursesWithSectionsToCanvasCourseSections(await this.getCachedTeacherSections()).filter(s => { return localeIncludes(s.name, searchText) })
  }
}

export class CourseSectionSearcher extends SectionSearcher {
  constructor (termId: number, courseId: number, setSectionsCallabck: (sections: CanvasCourseSectionWithCourseName[]) => void, courseName: string, updateTitle?: (title: string) => void) {
    super(termId, courseId, 'Prepared to merge', '', '', setSectionsCallabck, updateTitle)
    this.isInteractive = false
    this.courseName = courseName
  }

  courseName: string
  resetTitle = undefined

  // implemented as a noninteractive searcher, so it's not using any search text.  If search is enabled use the search text
  searchImpl = async (searchText: string): Promise<CanvasCourseSectionWithCourseName[]> => {
    return injectCourseName(await getCourseSections(this.courseId), this.courseName)
  }
}

const coursesWithSectionsToCanvasCourseSections = (coursesWithSections: CourseWithSections[]): CanvasCourseSectionWithCourseName[] => {
  return coursesWithSections.map(courseWithSections => {
    return courseWithSections.sections.map(section => { return injectCourseName([section], courseWithSections.name)[0] })
  }).flat()
}
