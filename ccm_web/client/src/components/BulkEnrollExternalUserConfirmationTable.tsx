import React, { useState } from 'react'

import CustomTable from './CustomTable'
import { RowNumberedAddNewExternalUserEnrollment } from '../models/enrollment'

interface BulkEnrollExternalConfirmationTableProps {
  enrollments: RowNumberedAddNewExternalUserEnrollment[]
}

interface TableHeaderColumnInfoShouldUseMatUIType {
  id: keyof RowNumberedAddNewExternalUserEnrollment
  label: string
  minWidth: number
  align?: 'left' | 'right' | undefined
}

const columns: TableHeaderColumnInfoShouldUseMatUIType[] = [
  { id: 'rowNumber', label: 'Row Number', minWidth: 25 },
  { id: 'email', label: 'Email', minWidth: 100 },
  { id: 'role', label: 'Role', minWidth: 100 },
  { id: 'firstName', label: 'First name', minWidth: 100 },
  { id: 'lastName', label: 'Last name', minWidth: 100 }
]

function BulkEnrollUMUserConfirmationTable (props: BulkEnrollExternalConfirmationTableProps): JSX.Element {
  const [page, setPage] = useState<number>(0)

  const tableRows = props.enrollments
  const caption = `Data was found for ${props.enrollments.length} enrollments.`

  return <CustomTable<RowNumberedAddNewExternalUserEnrollment> {...{ tableRows, columns, page, setPage, caption }} />
}

export default BulkEnrollUMUserConfirmationTable
