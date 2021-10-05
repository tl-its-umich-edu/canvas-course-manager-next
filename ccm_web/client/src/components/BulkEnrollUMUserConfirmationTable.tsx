import React, { useState } from 'react'
import CustomTable from './CustomTable'

interface IAddUMUserEnrollment {
  rowNumber: number
  loginId: string
  role: string
}

interface BulkEnrollUMUserConfirmationTableProps {
  enrollments: IAddUMUserEnrollment[]
}

interface TableHeaderColumnInfoShouldUseMatUIType {
  id: keyof IAddUMUserEnrollment
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

  return <CustomTable<IAddUMUserEnrollment> {...{ tableRows, columns, page, setPage }} />
}

export type { BulkEnrollUMUserConfirmationTableProps, IAddUMUserEnrollment }
export default BulkEnrollUMUserConfirmationTable
