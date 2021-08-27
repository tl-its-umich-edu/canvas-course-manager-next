import React, { useState } from 'react'
import ConfirmationTable from './ConfirmationTable'

interface IAddUMUserEnrollment {
  rowNumber: number
  loginID: string
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
  { id: 'loginID', label: 'Login ID', minWidth: 100 },
  { id: 'role', label: 'Role', minWidth: 100 }
]

function BulkEnrollUMUserConfirmationTable (props: BulkEnrollUMUserConfirmationTableProps): JSX.Element {
  const [page, setPage] = useState<number>(0)

  const tableRows = props.enrollments.sort((a, b) => a.loginID.localeCompare(b.loginID))

  return <ConfirmationTable<IAddUMUserEnrollment> {...{ tableRows, columns, page, setPage }} />
}

export type { BulkEnrollUMUserConfirmationTableProps, IAddUMUserEnrollment }
export default BulkEnrollUMUserConfirmationTable
