import React, { useEffect, useState } from 'react'
import { Paper, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TablePagination, TableRow } from '@material-ui/core'
import { TablePaginationActions } from './TablePagination'
import StyledTableCell from './StyledTableCell'

interface ValidationError {
  rowNumber: number
  message: string
}

interface ErrorTableProps {
  invalidations: ValidationError[]
}

interface TableHeaderColumnInfoShouldUseMatUIType {
  id: keyof ValidationError
  label: string
  minWidth: number
  align?: 'left' | 'right' | undefined
}

const columns: TableHeaderColumnInfoShouldUseMatUIType[] = [
  { id: 'rowNumber', label: 'Row Number', minWidth: 25 },
  { id: 'message', label: 'Error', minWidth: 100 }
]

function ErrorTable (props: ErrorTableProps): JSX.Element {
  const [tableRows, setTableRows] = useState<ValidationError[]>([])
  const [page, setPage] = React.useState<number>(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(5)

  useEffect(() => {
    setTableRows(props.invalidations.map(i => {
      return { rowNumber: i.rowNumber, message: i.message }
    }).sort((a, b) => (a.rowNumber < b.rowNumber ? -1 : 1))
    )
  }, [props.invalidations])

  const renderTable = (): JSX.Element => {
    const emptyRows = rowsPerPage - Math.min(rowsPerPage, tableRows.length - page * rowsPerPage)

    const handleChangePage = (event: unknown, newPage: number): void => {
      setPage(newPage)
    }

    const handleChangeRowsPerPage = (event: { target: { value: string } }): void => {
      setRowsPerPage(parseInt(event.target.value, rowsPerPage))
      setPage(0)
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
                <TableRow hover role="checkbox" tabIndex={-1} key={row.rowNumber.toString() + row.message}>
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
                onChangeRowsPerPage={handleChangeRowsPerPage}
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

export type { ErrorTableProps, ValidationError }
export default ErrorTable
