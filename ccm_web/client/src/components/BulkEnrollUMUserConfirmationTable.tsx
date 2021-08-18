import React, { useState } from 'react'
import ConfirmationTable from './ConfirmationTable'

interface IAddUMUser {
  rowNumber: number
  uniqname: string
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
  { id: 'uniqname', label: 'Uniqname', minWidth: 100 },
  { id: 'role', label: 'Section Name', minWidth: 100 }
]

function BulkEnrollUMUserConfirmationTable (props: BulkEnrollUMUserConfirmationTableProps): JSX.Element {
  const [page, setPage] = useState<number>(0)

  const tableRows = props.users.sort((a, b) => a.uniqname.localeCompare(b.uniqname))

  return <ConfirmationTable<IAddUMUser> {...{ tableRows, columns, page, setPage }} />
}

export type { BulkEnrollUMUserConfirmationTableProps, IAddUMUser }
export default BulkEnrollUMUserConfirmationTable
