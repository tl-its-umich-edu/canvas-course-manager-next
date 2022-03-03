import React, { useState } from 'react'

import CustomTable, { TableColumn } from './CustomTable'
import { ErrorDescription } from '../utils/handleErrors'

interface APIErrorsTableProps {
  errors: ErrorDescription[]
}

interface NumberedErrorDescription extends ErrorDescription {
  rowNumber: number
}

const columns: Array<TableColumn<NumberedErrorDescription>> = [
  { id: 'rowNumber', label: 'Error Number', minWidth: 25 },
  { id: 'context', label: 'Failed Process', minWidth: 100 },
  { id: 'input', label: 'Failed Input', minWidth: 50 },
  { id: 'errorText', label: 'Error Message', minWidth: 100 },
  { id: 'action', label: 'Recommended Action', minWidth: 100 }
]

function APIErrorsTable (props: APIErrorsTableProps): JSX.Element {
  const [page, setPage] = useState<number>(0)

  const tableRows = props.errors.map((e, i) => ({ ...e, rowNumber: i + 1 }))
  const caption = `${props.errors.length} API errors occurred.`

  return <CustomTable<NumberedErrorDescription> {...{ tableRows, columns, page, setPage, caption }} />
}

export default APIErrorsTable
