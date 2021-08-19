import React, { useState } from 'react'
import ConfirmationTable from './ConfirmationTable'

interface IAddUMUser {
  rowNumber: number
  loginID: string
  role: string
}

interface BulkEnrollUMUserConfirmationTableProps {
  users: IAddUMUser[]
}

interface TableHeaderColumnInfoShouldUseMatUIType {
  id: keyof IAddUMUser
  label: string
  minWidth: number
  align?: 'left' | 'right' | undefined
}

const columns: TableHeaderColumnInfoShouldUseMatUIType[] = [
  { id: 'rowNumber', label: 'Row Number', minWidth: 25 },
  { id: 'loginID', label: 'Login ID', minWidth: 100 },
  { id: 'role', label: 'Section Name', minWidth: 100 }
]

function BulkEnrollUMUserConfirmationTable (props: BulkEnrollUMUserConfirmationTableProps): JSX.Element {
  const [page, setPage] = useState<number>(0)

  const tableRows = props.users.sort((a, b) => a.loginID.localeCompare(b.loginID))

  return <ConfirmationTable<IAddUMUser> {...{ tableRows, columns, page, setPage }} />
}

export type { BulkEnrollUMUserConfirmationTableProps, IAddUMUser }
export default BulkEnrollUMUserConfirmationTable
