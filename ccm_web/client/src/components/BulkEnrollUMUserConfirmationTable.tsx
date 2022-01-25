import React, { useState } from 'react'

import CustomTable from './CustomTable'
import { RowNumberedAddEnrollment } from '../models/enrollment'

interface BulkEnrollUMUserConfirmationTableProps {
  enrollments: RowNumberedAddEnrollment[]
}

interface TableHeaderColumnInfoShouldUseMatUIType {
  id: keyof RowNumberedAddEnrollment
  label: string
  minWidth: number
  align?: 'left' | 'right' | undefined
}

const columns: TableHeaderColumnInfoShouldUseMatUIType[] = [
  { id: 'rowNumber', label: 'Row Number', minWidth: 25 },
  { id: 'loginId', label: 'Login ID', minWidth: 100 },
  { id: 'role', label: 'Role', minWidth: 100 }
]

function BulkEnrollUMUserConfirmationTable (props: BulkEnrollUMUserConfirmationTableProps): JSX.Element {
  const [page, setPage] = useState<number>(0)

  const tableRows = props.enrollments

  return <CustomTable<RowNumberedAddEnrollment> {...{ tableRows, columns, page, setPage }} />
}

export default BulkEnrollUMUserConfirmationTable
