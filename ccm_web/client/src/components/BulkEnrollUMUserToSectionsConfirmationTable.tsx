import React, { useState } from 'react'

import CustomTable from './CustomTable'
import { AddRowNumberedEnrollmentWithSectionId } from '../models/enrollment'

interface BulkEnrollUMUserSectionsConfirmationTableProps {
  enrollments: AddRowNumberedEnrollmentWithSectionId[]
}

interface TableHeaderColumnInfoShouldUseMatUIType {
  id: keyof AddRowNumberedEnrollmentWithSectionId
  label: string
  minWidth: number
  align?: 'left' | 'right' | undefined
}

const columns: TableHeaderColumnInfoShouldUseMatUIType[] = [
  { id: 'rowNumber', label: 'Row Number', minWidth: 25 },
  { id: 'loginID', label: 'Login ID', minWidth: 100 },
  { id: 'role', label: 'Role', minWidth: 100 },
  { id: 'sectionId', label: 'Section ID', minWidth: 100 }
]

function BulkEnrollUMUserSectionsConfirmationTable (props: BulkEnrollUMUserSectionsConfirmationTableProps): JSX.Element {
  const [page, setPage] = useState<number>(0)
  const tableRows = props.enrollments
  return <CustomTable<AddRowNumberedEnrollmentWithSectionId> {...{ tableRows, columns, page, setPage }} />
}

export default BulkEnrollUMUserSectionsConfirmationTable
