import React, { useState } from 'react'

import CustomTable from './CustomTable'
import { RowNumberedAddEnrollmentWithSectionId } from '../models/enrollment'

interface BulkEnrollUMUserSectionsConfirmationTableProps {
  enrollments: RowNumberedAddEnrollmentWithSectionId[]
}

interface TableHeaderColumnInfoShouldUseMatUIType {
  id: keyof RowNumberedAddEnrollmentWithSectionId
  label: string
  minWidth: number
  align?: 'left' | 'right' | undefined
}

const columns: TableHeaderColumnInfoShouldUseMatUIType[] = [
  { id: 'rowNumber', label: 'Row Number', minWidth: 25 },
  { id: 'loginId', label: 'Login ID', minWidth: 100 },
  { id: 'role', label: 'Role', minWidth: 100 },
  { id: 'sectionId', label: 'Section ID', minWidth: 100 }
]

function BulkEnrollUMUserSectionsConfirmationTable (props: BulkEnrollUMUserSectionsConfirmationTableProps): JSX.Element {
  const [page, setPage] = useState<number>(0)
  const tableRows = props.enrollments
  const caption = `Data was found for ${props.enrollments.length} enrollments.`
  return <CustomTable<RowNumberedAddEnrollmentWithSectionId> {...{ tableRows, columns, page, setPage, caption }} />
}

export default BulkEnrollUMUserSectionsConfirmationTable
