import { useEffect, useState } from 'react'
import renderTable from './ConfirmationTableTableRenderer'

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
  const [tableRows, setTableRows] = useState<StudentGrade[]>([])
  const [page, setPage] = useState<number>(0)
  const rowsPerPage = 5

  useEffect(() => {
    setTableRows(props.grades.map(i => {
      return { rowNumber: i.rowNumber, uniqname: i.uniqname, grade: i.grade }
    }).sort((a, b) => (a.rowNumber < b.rowNumber ? -1 : 1))
    )
  }, [props.grades])

  return renderTable(tableRows, columns, page, setPage, rowsPerPage)
}

export type { GradebookUploadConfirmationTableProps, StudentGrade }
export default GradebookUploadConfirmationTable
