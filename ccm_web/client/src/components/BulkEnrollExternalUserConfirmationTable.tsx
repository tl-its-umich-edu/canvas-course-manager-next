import React, { useState } from 'react'

import CustomTable from './CustomTable'
import { AddNumberedNewExternalUserEnrollment } from '../models/enrollment'

interface BulkEnrollExternalConfirmationTableProps {
  enrollments: AddNumberedNewExternalUserEnrollment[]
}

interface TableHeaderColumnInfoShouldUseMatUIType {
  id: keyof AddNumberedNewExternalUserEnrollment
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

  return <CustomTable<AddNumberedNewExternalUserEnrollment> {...{ tableRows, columns, page, setPage }} />
}

export type { AddNumberedNewExternalUserEnrollment }
export default BulkEnrollUMUserConfirmationTable
