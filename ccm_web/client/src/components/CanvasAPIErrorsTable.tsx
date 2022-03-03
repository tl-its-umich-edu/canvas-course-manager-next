import React, { useState } from 'react'

import CustomTable, { TableColumn } from './CustomTable'
import { CanvasAPIErrorPayload } from '../models/models'

interface CanvasAPIErrorsTableProps {
  errors: CanvasAPIErrorPayload[]
}

interface NumberedCanvasAPIErrorPayload extends CanvasAPIErrorPayload {
  rowNumber: number
}

const columns: Array<TableColumn<NumberedCanvasAPIErrorPayload>> = [
  { id: 'rowNumber', label: 'Error Number', minWidth: 25 },
  // Thinking this will just confuse users, so may not include it.
  // { id: 'canvasStatusCode', label: 'Canvas Status Code', minWidth: 100 },
  { id: 'failedInput', label: 'Failed Input', minWidth: 125 },
  { id: 'message', label: 'Error Message', minWidth: 125 }
]

function CanvasAPIErrorsTable (props: CanvasAPIErrorsTableProps): JSX.Element {
  const [page, setPage] = useState<number>(0)

  const tableRows = props.errors.map((e, i) => ({ ...e, rowNumber: i + 1 }))
  const caption = `${props.errors.length} Canvas errors occurred.`

  return <CustomTable<NumberedCanvasAPIErrorPayload> {...{ tableRows, columns, page, setPage, caption }} />
}

export default CanvasAPIErrorsTable
