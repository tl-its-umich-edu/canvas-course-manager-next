import { useEffect, useState } from 'react'
import renderTable from './ConfirmationTableTableRenderer'

interface Section {
  rowNumber: number
  sectionName: string
}

interface BulkSectionCreateUploadConfirmationTableProps {
  sectionNames: Section[]
}

interface TableHeaderColumnInfoShouldUseMatUIType {
  id: keyof Section
  label: string
  minWidth: number
  align?: 'left' | 'right' | undefined
}

const columns: TableHeaderColumnInfoShouldUseMatUIType[] = [
  { id: 'rowNumber', label: 'Row Number', minWidth: 25 },
  { id: 'sectionName', label: 'Section Name', minWidth: 100 }
]

function BulkSectionCreateUploadConfirmationTable (props: BulkSectionCreateUploadConfirmationTableProps): JSX.Element {
  const [tableRows, setTableRows] = useState<Section[]>([])
  const [page, setPage] = useState<number>(0)

  const rowsPerPage = 5

  useEffect(() => {
    setTableRows(props.sectionNames.map(i => {
      return { rowNumber: i.rowNumber, sectionName: i.sectionName }
    }).sort((a, b) => (a.rowNumber < b.rowNumber ? -1 : 1))
    )
  }, [props.sectionNames])

  return renderTable(tableRows, columns, page, setPage, rowsPerPage)
}

export type { BulkSectionCreateUploadConfirmationTableProps, Section }
export default BulkSectionCreateUploadConfirmationTable
