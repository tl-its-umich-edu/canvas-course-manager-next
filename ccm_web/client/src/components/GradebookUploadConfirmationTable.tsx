import { GradeRounded } from '@material-ui/icons'
import React, { useState } from 'react'
import ConfirmationTable from './ConfirmationTable'

interface StudentGrade {
  rowNumber: number
  uniqname: string
  grade: string
  overrideGrade: string | undefined
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
  { id: 'uniqname', label: 'Uniqname', minWidth: 100 },
  { id: 'grade', label: 'Grade', minWidth: 75 },
  { id: 'overrideGrade', label: 'Override Grade', minWidth: 75 }
]

function GradebookUploadConfirmationTable (props: GradebookUploadConfirmationTableProps): JSX.Element {
  const [page, setPage] = useState<number>(0)

  const tableRows = props.grades.sort((a, b) => (a.rowNumber < b.rowNumber ? -1 : 1))
  const confirmationTableColumns = (tableRows.filter(grade => { return grade.overrideGrade !== undefined }).length > 0)
    ? columns
    : columns.filter(column => { return column.id !== 'overrideGrade' })

  return <ConfirmationTable<StudentGrade> {...{ tableRows, columns: confirmationTableColumns, page, setPage }} />
}

export type { GradebookUploadConfirmationTableProps, StudentGrade }
export default GradebookUploadConfirmationTable
