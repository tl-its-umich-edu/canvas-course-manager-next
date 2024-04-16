import React, { useState } from 'react'

import CustomTable, { TableColumn } from './CustomTable.js'
import { ErrorDescription } from '../utils/handleErrors.js'

interface NumberedErrorDescription extends ErrorDescription {
  rowNumber: number
}

const mainColumns: Array<TableColumn<NumberedErrorDescription>> = [
  { id: 'rowNumber', label: 'Error Number', minWidth: 25 },
  { id: 'input', label: 'Failed Input', minWidth: 50 },
  { id: 'errorText', label: 'Error Message', minWidth: 100 },
  { id: 'action', label: 'Recommended Action', minWidth: 100 }
]

const contextColumn: TableColumn<NumberedErrorDescription> = { id: 'context', label: 'Failed Process', minWidth: 100 }

interface APIErrorsTableProps {
  errors: ErrorDescription[]
  includeContext?: boolean
}

function APIErrorsTable (props: APIErrorsTableProps): JSX.Element {
  const [page, setPage] = useState<number>(0)

  const columnsToUse = props.includeContext === true
    ? [...mainColumns.slice(0, 1), contextColumn, ...mainColumns.slice(1)]
    : mainColumns

  const tableRows = props.errors.map((e, i) => ({ ...e, rowNumber: i + 1 }))
  const caption = `${props.errors.length} API errors occurred.`

  return (
    <CustomTable<NumberedErrorDescription>
      columns={columnsToUse}
      {...{ tableRows, page, setPage, caption }}
    />
  )
}

export default APIErrorsTable
