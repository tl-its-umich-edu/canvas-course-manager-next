import { getTeacherSections, searchSections } from '../api'
import { CanvasCourseSection, CourseWithSections } from '../models/canvas'
import { ISectionSearcher } from '../pages/MergeSections'
import { localeIncludes } from './localeIncludes'

export abstract class SectionSearcher implements ISectionSearcher {
  name: string
  preload: string | undefined
  termId: number
  courseId: number
  setSections: (sections: CanvasCourseSection[]) => void
  updateTitleCallback: (title: string) => void
  constructor (termId: number, courseId:number, name: string, preload: string | undefined, setSectionsCallabck: (sections: CanvasCourseSection[]) => void, updateTitle: (title: string) => void) {
    this.termId = termId
    this.courseId = courseId
    this.name = name
    this.preload = preload
    this.setSections = setSectionsCallabck
    this.updateTitleCallback = updateTitle
  }

  abstract resetTitle: () => void

  abstract searchImpl: (searchText: string) => Promise<void>

  init = async (): Promise<void> => {
    if (this.preload !== undefined) {
      return await this.searchImpl(this.preload)
    } else {
      this.setSections([])
    }
  }

  search = async (searchString: string): Promise<void> => {
    this.updateTitleCallback('Searching...')
    this.setSections([])
    return await this.searchImpl(searchString)
  }
}

export class UniqnameSearcher extends SectionSearcher {
  constructor (termId: number, courseId: number, setSectionsCallabck: (sections: CanvasCourseSection[]) => void, updateTitle: (title: string) => void) {
    super(termId, courseId, 'Uniqname', undefined, setSectionsCallabck, updateTitle)
  }

  resetTitle = (): void => {
    this.updateTitleCallback('Sections for uniqname')
  }

  searchImpl = async (searchText: string): Promise<void> => {
    if (searchText === undefined) {
      return
    }

    // this.setSections(coursesWithSectionsToCanvasCourseSections(await searchSections(this.termId, 'uniqname', searchText)))

    const coursesWithSections = await (await searchSections(this.termId, 'uniqname', searchText)).filter(course => { return course.id !== this.courseId })
    const canvasCourseSections = coursesWithSectionsToCanvasCourseSections(coursesWithSections)
    this.updateTitleCallback(`Search results (${canvasCourseSections.length})`)
    this.setSections(canvasCourseSections)
  }
}

export class CourseNameSearcher extends SectionSearcher {
  constructor (termId: number, courseId: number, setSectionsCallabck: (sections: CanvasCourseSection[]) => void, updateTitle: (title: string) => void) {
    super(termId, courseId, 'Course Name', undefined, setSectionsCallabck, updateTitle)
  }

  resetTitle = (): void => {
    this.updateTitleCallback('Sections for course name')
  }

  searchImpl = async (searchText: string): Promise<void> => {
    if (searchText === undefined) {
      return
    }
    const coursesWithSections = await (await searchSections(this.termId, 'coursename', searchText)).filter(course => { return course.id !== this.courseId })
    const canvasCourseSections = coursesWithSectionsToCanvasCourseSections(coursesWithSections)
    this.updateTitleCallback(`Search results (${canvasCourseSections.length})`)
    this.setSections(canvasCourseSections)
  }
}

export class SectionNameSearcher extends SectionSearcher {
  constructor (termId: number, courseId: number, setSectionsCallabck: (sections: CanvasCourseSection[]) => void, updateTitle: (title: string) => void) {
    super(termId, courseId, 'Section Name', '', setSectionsCallabck, updateTitle)
  }

  resetTitle = (): void => {
    this.updateTitleCallback('Sections I Teach')
  }

  searchImpl = async (searchText: string): Promise<void> => {
    // const sections = await (coursesWithSectionsToCanvasCourseSections(await getTeacherSections(this.termId))).filter(s => { return localeIncludes(s.name, searchText) })
    // this.setSections(sections)

    const coursesWithSections = await getTeacherSections(this.termId)
    const canvasCourseSections = coursesWithSectionsToCanvasCourseSections(coursesWithSections).filter(s => { return localeIncludes(s.name, searchText) })
    this.updateTitleCallback(`Search results (${canvasCourseSections.length}`)
    this.setSections(canvasCourseSections)
  }
}

const coursesWithSectionsToCanvasCourseSections = (coursesWithSections: CourseWithSections[]): CanvasCourseSection[] => {
  return coursesWithSections.map(courseWithSections => {
    return courseWithSections.sections.map(section => { return { ...section, course_name: courseWithSections.name } })
  }).flat()
}

// const canvasCourseSectionsToCoursesWithSections = (canvasCourseSections: CanvasCourseSection[]): CourseWithSections[] => {
//   return canvasCourseSections.map(canvasCourseSection => {
//     return {
//       id: canvasCourseSection.course_id,
//       name: canvasCourseSection.course_name,
//       enrollment_term_id: 0,
//       sections: canvasCourseSections
//     }
//   }).flat()
// }
