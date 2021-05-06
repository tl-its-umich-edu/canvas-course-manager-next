import React, { useEffect, useState } from 'react'
import { IconButton, makeStyles, Paper, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TablePagination, TableRow, useTheme } from '@material-ui/core'
import { KeyboardArrowRight, KeyboardArrowLeft, LastPage as LastPageIcon, FirstPage as FirstPageIcon } from '@material-ui/icons'
import PropTypes from 'prop-types'

const useStyles = makeStyles((theme) => ({
  root: {
    flexShrink: 0,
    marginLeft: theme.spacing(2.5)
  }
}))

interface StudentGrade {
  rowNumber: number
  uniqname: string
  grade: string
}

interface ConfirmationTableProps {
  grades: StudentGrade[]
}

interface TableHeaderColumnInfoShouldUseMatUIType {
  id: keyof StudentGrade
  label: string
  minWidth: number
  align?: 'left' | 'right' | undefined
}

const columns: TableHeaderColumnInfoShouldUseMatUIType[] = [
  { id: 'rowNumber', label: 'Row Number', minWidth: 25 },
  { id: 'uniqname', label: 'uniqname', minWidth: 100 },
  { id: 'grade', label: 'grade', minWidth: 100 }
]

function ConfirmationTable (props: ConfirmationTableProps): JSX.Element {
  // const classes = useStyles()
  const [tableRows, setTableRows] = useState<StudentGrade[]>([])
  const [page, setPage] = React.useState<number>(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(5)

  useEffect(() => {
    setTableRows(props.grades.map(i => {
      return { rowNumber: i.rowNumber, uniqname: i.uniqname, grade: i.grade }
    }).sort((a, b) => (a.rowNumber < b.rowNumber ? -1 : 1))
    )
  }, [props.grades])

  const renderTable = (): JSX.Element => {
    const emptyRows = rowsPerPage - Math.min(rowsPerPage, tableRows.length - page * rowsPerPage)

    const handleChangePage = (event: unknown, newPage: number): void => {
      setPage(newPage)
    }

    const handleChangeRowsPerPage = (event: { target: { value: string } }): void => {
      setRowsPerPage(parseInt(event.target.value, rowsPerPage))
      setPage(0)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function TablePaginationActions (props: { count: any, page: any, rowsPerPage: any, onChangePage: any }): JSX.Element {
      const classes = useStyles()
      const theme = useTheme()
      const { count, page, rowsPerPage, onChangePage } = props

      const handleFirstPageButtonClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
        onChangePage(event, 0)
      }

      const handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
        onChangePage(event, page - 1)
      }

      const handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        onChangePage(event, props.page + 1)
      }

      const handleLastPageButtonClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
        onChangePage(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1))
      }

      return (
        <div className={classes.root}>
          <IconButton
            onClick={handleFirstPageButtonClick}
            disabled={page === 0}
            aria-label="first page"
          >
            {theme.direction === 'rtl' ? <LastPageIcon /> : <FirstPageIcon />}
          </IconButton>
          <IconButton onClick={handleBackButtonClick} disabled={page === 0} aria-label="previous page">
            {theme.direction === 'rtl' ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
          </IconButton>
          <IconButton
            onClick={handleNextButtonClick}
            disabled={page >= Math.ceil(count / rowsPerPage) - 1}
            aria-label="next page"
          >
            {theme.direction === 'rtl' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
          </IconButton>
          <IconButton
            onClick={handleLastPageButtonClick}
            disabled={page >= Math.ceil(count / rowsPerPage) - 1}
            aria-label="last page"
          >
            {theme.direction === 'rtl' ? <FirstPageIcon /> : <LastPageIcon />}
          </IconButton>
        </div>
      )
    }

    TablePaginationActions.propTypes = {
      count: PropTypes.number.isRequired,
      onChangePage: PropTypes.func.isRequired,
      page: PropTypes.number.isRequired,
      rowsPerPage: PropTypes.number.isRequired
    }

    return (
      <TableContainer component={Paper}>
        <Table stickyHeader aria-label="custom pagination table">
          <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align}
                    style={{ minWidth: column.minWidth }}
                  >
                    {column.label}
                  </TableCell>
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

export type { ConfirmationTableProps, StudentGrade }
export default ConfirmationTable
