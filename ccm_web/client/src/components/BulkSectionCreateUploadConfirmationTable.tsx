import React, { useState } from 'react'
import CustomTable from './CustomTable.js'

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
  const [page, setPage] = useState<number>(0)

  const tableRows = props.sectionNames.sort((a, b) => (a.rowNumber < b.rowNumber ? -1 : 1))
  const caption = `Data was found for ${props.sectionNames.length} sections.`

  return <CustomTable<Section> {...{ tableRows, columns, page, setPage, caption }} />
}

export type { BulkSectionCreateUploadConfirmationTableProps, Section }
export default BulkSectionCreateUploadConfirmationTable
