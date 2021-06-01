import React, { useState } from 'react'
import ConfirmationTable from './ConfirmationTable'

interface StudentGrade {
  rowNumber: number
  uniqname: string
  grade: string
}

interface GradebookUploadConfirmationTableProps {
  grades: StudentGrade[]
}

interface TableHeaderColumnInfoShouldUseMatUIType {
  id: keyof StudentGrade
  label: string
  minWidth: number
  align?: 'left' | 'right' | undefined
}

const columns: TableHeaderColumnInfoShouldUseMatUIType[] = [
  { id: 'rowNumber', label: 'Row Number', minWidth: 25 },
  { id: 'uniqname', label: 'uniqname', minWidth: 100 },
  { id: 'grade', label: 'grade', minWidth: 100 }
]

function GradebookUploadConfirmationTable (props: GradebookUploadConfirmationTableProps): JSX.Element {
  const [page, setPage] = useState<number>(0)

  const tableRows = props.grades.sort((a, b) => (a.rowNumber < b.rowNumber ? -1 : 1))

  return <ConfirmationTable<StudentGrade> {...{ tableRows, columns, page, setPage }} />
}

export type { GradebookUploadConfirmationTableProps, StudentGrade }
export default GradebookUploadConfirmationTable
