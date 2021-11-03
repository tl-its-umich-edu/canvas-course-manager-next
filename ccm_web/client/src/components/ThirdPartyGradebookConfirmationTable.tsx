import React, { useState } from 'react'

import CustomTable from './CustomTable'
import { REQUIRED_LOGIN_ID_HEADER } from '../utils/ThirdPartyGradebookProcessor'

interface NumberedSlimGradebookRecord extends Record<string, string | number | undefined> {
  rowNumber: number
  'SIS Login ID': string
}

interface ThirdPartyGradebookConfirmationTableProps {
  records: NumberedSlimGradebookRecord[]
  assignmentHeader: string
}

interface TableHeaderColumnInfoShouldUseMatUIType {
  id: keyof NumberedSlimGradebookRecord
  label: string
  minWidth: number
  align?: 'left' | 'right' | undefined
}

function ThirdPartyGradebookConfirmationTable (props: ThirdPartyGradebookConfirmationTableProps): JSX.Element {
  const columns: TableHeaderColumnInfoShouldUseMatUIType[] = [
    { id: 'rowNumber', label: 'Row Number', minWidth: 25 },
    { id: REQUIRED_LOGIN_ID_HEADER, label: REQUIRED_LOGIN_ID_HEADER, minWidth: 100 },
    { id: props.assignmentHeader, label: props.assignmentHeader, minWidth: 100 }
  ]

  const [page, setPage] = useState<number>(0)

  const tableRows = props.records.sort((a, b) => (a.rowNumber < b.rowNumber ? -1 : 1))
  return <CustomTable<NumberedSlimGradebookRecord> {...{ tableRows, columns, page, setPage }} />
}

export default ThirdPartyGradebookConfirmationTable
