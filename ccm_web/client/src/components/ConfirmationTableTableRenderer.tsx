import { Paper, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TablePagination, TableRow } from '@material-ui/core'
import React from 'react'
import StyledTableCell from './StyledTableCell'
import { TablePaginationActions } from './TablePagination'

interface ConfirmationTableColumn {
  id: string
  label: string
  minWidth: number
  align?: 'left' | 'right' | undefined
}

const renderTable = (tableRows: any[], columns: ConfirmationTableColumn[], page: number, setPage: (page: number) => void, rowsPerPage: number): JSX.Element => {
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

export type { ConfirmationTableColumn }
export default renderTable
