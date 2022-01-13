import React, { useState } from 'react'

import CustomTable from './CustomTable'
import { AddRowNumberedEnrollmentWithSectionID } from '../models/enrollment'

interface BulkEnrollUMUserSectionsConfirmationTableProps {
  enrollments: AddRowNumberedEnrollmentWithSectionID[]
}

interface TableHeaderColumnInfoShouldUseMatUIType {
  id: keyof AddRowNumberedEnrollmentWithSectionID
  label: string
  minWidth: number
  align?: 'left' | 'right' | undefined
}

const columns: TableHeaderColumnInfoShouldUseMatUIType[] = [
  { id: 'rowNumber', label: 'Row Number', minWidth: 25 },
  { id: 'loginID', label: 'Login ID', minWidth: 100 },
  { id: 'role', label: 'Role', minWidth: 100 },
  { id: 'sectionID', label: 'Section ID', minWidth: 100 }
]

function BulkEnrollUMUserSectionsConfirmationTable (props: BulkEnrollUMUserSectionsConfirmationTableProps): JSX.Element {
  const [page, setPage] = useState<number>(0)
  const tableRows = props.enrollments
  return <CustomTable<AddRowNumberedEnrollmentWithSectionID> {...{ tableRows, columns, page, setPage }} />
}

export default BulkEnrollUMUserSectionsConfirmationTable
