import React, { useState } from 'react'
import CustomTable from './CustomTable'

interface NumberedSlimGradebookRecord {
  rowNumber: number
  'Student Name': string
  'SIS Login ID': string
}

interface ThirdPartyGradebookConfirmationTableProps {
  records: NumberedSlimGradebookRecord[]
}

interface TableHeaderColumnInfoShouldUseMatUIType {
  id: keyof NumberedSlimGradebookRecord
  label: string
  minWidth: number
  align?: 'left' | 'right' | undefined
}

const columns: TableHeaderColumnInfoShouldUseMatUIType[] = [
  { id: 'rowNumber', label: 'New Row Number', minWidth: 25 },
  { id: 'Student Name', label: 'Student Name', minWidth: 50 },
  { id: 'SIS Login ID', label: 'SIS Login ID', minWidth: 100 }
]

function ThirdPartyGradebookConfirmationTable (props: ThirdPartyGradebookConfirmationTableProps): JSX.Element {
  const [page, setPage] = useState<number>(0)

  const tableRows = props.records.sort((a, b) => (a.rowNumber < b.rowNumber ? -1 : 1))
  return <CustomTable<NumberedSlimGradebookRecord> {...{ tableRows, columns, page, setPage }} />
}

export default ThirdPartyGradebookConfirmationTable
