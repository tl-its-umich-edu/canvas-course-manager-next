import React, { useEffect, useState } from 'react'
import { createStyles, Paper, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TablePagination, TableRow, Theme, withStyles } from '@material-ui/core'
import { grey } from '@material-ui/core/colors'
import { TablePaginationActions } from './TablePagination'

const StyledTableCell = withStyles((theme: Theme) =>
  createStyles({
    head: {
      backgroundColor: grey[100],
      color: theme.palette.common.black,
      fontWeight: 'bold'
    },
    body: {
      fontSize: 24
    }
  })
)(TableCell)

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

  const renderTable = (): JSX.Element => {
    const emptyRows = rowsPerPage - Math.min(rowsPerPage, tableRows.length - page * rowsPerPage)

    const handleChangePage = (event: unknown, newPage: number): void => {
      setPage(newPage)
    }

    return (
      <TableContainer component={Paper}>
        <Table stickyHeader aria-label="custom pagination table">
          <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <StyledTableCell
                    key={column.id}
                    align={column.align}
                    style={{ minWidth: column.minWidth }}
                  >
                    {column.label}
                  </StyledTableCell>
                ))}
              </TableRow>
            </TableHead>
          <TableBody>
            {tableRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
              return (
                <TableRow hover role="checkbox" tabIndex={-1} key={row.rowNumber}>
                  {columns.map((column) => {
                    const value = row[column.id]
                    return (
                      <TableCell key={column.id} align={column.align}>
                        {value}
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })}
            {emptyRows > 0 && (
              <TableRow style={{ height: 53 * emptyRows }}>
                <TableCell colSpan={6} />
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[rowsPerPage]}
                colSpan={3}
                count={tableRows.length}
                rowsPerPage={rowsPerPage}
                page={page}
                SelectProps={{
                  inputProps: { 'aria-label': 'rows per page' },
                  native: true
                }}
                onChangePage={handleChangePage}
                ActionsComponent={TablePaginationActions}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    )
  }

  return renderTable()
}

export type { BulkSectionCreateUploadConfirmationTableProps, Section }
export default BulkSectionCreateUploadConfirmationTable
