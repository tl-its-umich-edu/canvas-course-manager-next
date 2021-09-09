export interface CanvasCourseBase {
  id: number
  name: string
}

export interface CanvasCourseSection {
  id: number
  name: string
  total_students: number
  course_name: string
}

export interface CanvasRole {
  clientName: string
  canvasName: string
}

export const canvasRoles: CanvasRole[] = [
  { clientName: 'student', canvasName: 'StudentEnrollment' },
  { clientName: 'teacher', canvasName: 'TeacherEnrollment' },
  { clientName: 'ta', canvasName: 'TaEnrollment' },
  { clientName: 'observer', canvasName: 'ObserverEnrollment' },
  { clientName: 'designer', canvasName: 'DesignerEnrollment' }
]

export interface ICanvasCourseSectionSort {
  sort: (sections: CanvasCourseSection[]) => CanvasCourseSection[]
}

export class CanvasCourseSectionSort_AZ implements ICanvasCourseSectionSort {
  sort = (sections: CanvasCourseSection[]): CanvasCourseSection[] => {
    return sections.sort((a, b) => {
      return (a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }))
    })
  }
}

export class CanvasCourseSectionSort_ZA implements ICanvasCourseSectionSort {
  sort = (sections: CanvasCourseSection[]): CanvasCourseSection[] => {
    const sorter = new CanvasCourseSectionSort_AZ()
    return sorter.sort(sections).reverse()
  }
}

export class CanvasCourseSectionSort_UserCount implements ICanvasCourseSectionSort {
  sort = (sections: CanvasCourseSection[]): CanvasCourseSection[] => {
    return sections.sort((a, b) => {
      return (b.total_students - a.total_students)
    })
  }
}
