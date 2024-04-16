import { Paper, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TablePagination, TableRow } from '@mui/material'
import React from 'react'
import StyledTableCell from './StyledTableCell.js'
import TableCaption from './TableCaption.js'
import { TablePaginationActions } from './TablePagination.js'

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
  caption: string
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
        <TableCaption text={props.caption} />
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
                  return (
                    <TableCell key={String(column.id)} align={column.align}>
                      {String(row[column.id])}
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
