import { Paper, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TablePagination, TableRow } from '@material-ui/core'
import React from 'react'
import StyledTableCell from './StyledTableCell'
import { TablePaginationActions } from './TablePagination'

interface TableEntity {
  rowNumber: number
}

interface TableColumn<T> {
  id: keyof T
  label: string
  minWidth: number
  align?: 'left' | 'right' | undefined
}

interface TableProps<T> {
  tableRows: T[]
  columns: Array<TableColumn<T>>
  page: number
  setPage: (page: number) => void
}

function CustomTable<T extends TableEntity> (props: TableProps<T>): JSX.Element {
  const rowsPerPage = 5

  const { tableRows, columns, page, setPage } = props

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
                  key={String(column.id)}
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
              <TableRow hover key={row.rowNumber}>
                {columns.map((column) => {
                  const value = row[column.id]
                  return (
                    <TableCell key={String(column.id)} align={column.align}>
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
              count={tableRows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              SelectProps={{
                inputProps: { 'aria-label': 'rows per page' },
                native: true
              }}
              onPageChange={handleChangePage}
              ActionsComponent={TablePaginationActions}
              aria-live='polite'
            />
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  )
}

export type { TableColumn }
export default CustomTable
