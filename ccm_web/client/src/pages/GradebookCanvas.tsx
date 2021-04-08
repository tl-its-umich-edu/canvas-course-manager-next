import React, { useState } from 'react'
import { Grid, GridSize, IconButton, makeStyles, Paper, SvgIconProps, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TablePagination, TableRow, Typography, useTheme } from '@material-ui/core'
import CloudDoneIcon from '@material-ui/icons/CloudDone'
import CloudUploadIcon from '@material-ui/icons/CloudUpload'
import HourglassEmptyIcon from '@material-ui/icons/HourglassEmpty'
import { parse, ParseResult } from 'papaparse'
import { useSnackbar } from 'notistack'
import PropTypes from 'prop-types'

import FileUpload, { FileUploadActionProps } from '../components/FileUpload'
import { KeyboardArrowLeft, KeyboardArrowRight, LastPage as LastPageIcon, FirstPage as FirstPageIcon } from '@material-ui/icons'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: 25,
    textAlign: 'left'
  },
  table: {

  },
  tableBody: {
    minHeight: 391,
    maxHeight: 391
  },
  tableContainer: {
    minHeight: 500,
    maxHeight: 500
  },
  uploadIcon: {
    color: '#3F648E'
  },
  uploadErrorIcon: {
    color: 'red'
  }
}))

const useStyles1 = makeStyles((theme) => ({
  root: {
    flexShrink: 0,
    marginLeft: theme.spacing(2.5)
  }
}))

interface GradebookRecord {
  'Current Grade': string
  'Final Grade': string
  'SIS Login ID': string
  Student: string
}

interface GradebookRowInvalidation {
  message: string
  rowNumber: number
}
class CurrentAndFinalGradeMismatchInvalidation implements GradebookRowInvalidation {
  message: string
  record: GradebookRecord
  rowNumber: number
  constructor (record: GradebookRecord, rowNumber: number) {
    this.record = record
    this.rowNumber = rowNumber
    this.message = 'Current and Final grade mismatch: ' + record.Student + '(' + record['SIS Login ID'] + ')'
  }
}

interface GradebookRecordValidator {
  validate: (record: GradebookRecord, rowNumber: number) => GradebookRowInvalidation[]
}
abstract class GradebookValidator implements GradebookRecordValidator {
  abstract validate: (record: GradebookRecord, rowNumber: number) => GradebookRowInvalidation[]
}
class CurrentAndFinalGradeMatchGradebookValidator extends GradebookValidator {
  validate = (record: GradebookRecord, rowNumber: number): GradebookRowInvalidation[] => {
    const invalidations: GradebookRowInvalidation[] = []
    if (record['Final Grade'] !== record['Current Grade']) {
      invalidations.push(new CurrentAndFinalGradeMismatchInvalidation(record, rowNumber))
    }
    return invalidations
  }
}

function ConvertCanvasGradebook (): JSX.Element {
  const classes = useStyles()

  const uploadNeutralIcon: React.ReactElement<SvgIconProps> =
    (<CloudUploadIcon className={classes.uploadIcon} fontSize='large' />)

  const uploadValidIcon: React.ReactElement<SvgIconProps> =
    (<CloudDoneIcon className={classes.uploadIcon} fontSize='large' />)

  const uploadErrorIcon: React.ReactElement<SvgIconProps> =
    (<CloudUploadIcon className={classes.uploadErrorIcon} fontSize='large' />)

  const validatingIcon: React.ReactElement<SvgIconProps> =
    (<HourglassEmptyIcon className={classes.uploadIcon} fontSize='large' />)

  const { enqueueSnackbar } = useSnackbar()
  const [fileUploadLabelText, setFileUploadLabelText] = useState(['Upload csv'])
  const [fileUploadAction, setFileUploadAction] = useState<FileUploadActionProps | undefined>(undefined)
  const [uploadIcon, setUploadIcon] = useState(uploadNeutralIcon)
  // const [tableColumns, setTableColumns] = useState<GridSize>(0)
  const [tableHidden, setTableHidden] = useState(true)
  const [fileUploadColumns, setFileUploadColumns] = useState<GridSize>(12)
  const [tableRows, setTableRows] = useState<ValidationError[]>([])

  const uploadComplete = (file: File): void => {
    parseUpload(file)
  }

  const parseUpload = (file: File): void => {
    // This results in an error on the 2nd "header" row for possible scores
    handleValidating()
    parse<GradebookRecord>(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        handleParseComplete(results)
      }

    })
  }

  const handleValidating = (): void => {
    setUploadIcon(validatingIcon)
    setFileUploadLabelText(['Validating...'])
    setFileUploadAction(undefined)
  }

  const showTable = (show = true): void => {
    setFileUploadColumns(show ? 5 : 12)
    setTableHidden(!show)
  }

  const handleError = (errorMessage: string[], fileUploadAction: FileUploadActionProps|undefined, tableVisible: boolean): void => {
    enqueueSnackbar(errorMessage.join('  '), { variant: 'error' })
    setUploadIcon(uploadErrorIcon)
    setFileUploadLabelText(errorMessage)
    setFileUploadAction(fileUploadAction)
    showTable(tableVisible)
  }

  const handleNoLetterGradesError = (): void => {
    handleError(['Your file needs to include grade letter (A-E)', 'Change your grading scheme in settings'], { actionText: 'More Info', actionLink: new URL('http://documentation.its.umich.edu/node/401') }, false)
  }

  const handleRowLevelInvalidationError = (errorMessage: string[], fileUploadAction: FileUploadActionProps|undefined, invalidations: GradebookRowInvalidation[]): void => {
    setTableRows(invalidations.map(i => {
      return { rowNumber: i.rowNumber, message: i.message }
    }).sort((a, b) => (a.rowNumber < b.rowNumber ? -1 : 1))
    )
    handleError(errorMessage, fileUploadAction, true)
  }

  const handleParseSuccess = (): void => {
    setUploadIcon(uploadValidIcon)
    setFileUploadLabelText(['Your file is valid!', 'If this is the right file you want to upload click confirm'])
  }

  const handleParseComplete = (results: ParseResult<GradebookRecord>): void => {
    const data = results.data.slice(1) // The first row is possible scores

    if (data[0]['Final Grade'] === undefined) {
      // show message about the lack of grading scheme and Final Grade
      handleNoLetterGradesError()
      return
    }

    let invalidations: GradebookRowInvalidation[] = []

    const gradeMismatchValidator = new CurrentAndFinalGradeMatchGradebookValidator()

    data.forEach(record => {
      invalidations = invalidations.concat(gradeMismatchValidator.validate(record, data.indexOf(record) + 1))
    })

    if (invalidations.length > 0) {
      handleRowLevelInvalidationError(['There are blank cells in the gradebook. Please enter 0 or EX (for excused) for any blank cells in the gradebook and export a new CSV file.'], { actionText: 'Canvas: Preparing Final Grades for Wolverine Access.', actionLink: new URL('http://documentation.its.umich.edu/node/401') }, invalidations)
    } else {
      handleParseSuccess()
    }
  }

  interface ValidationError {
    rowNumber: number
    message: string
  }

  interface ColumnType {
    [key: string]: boolean
  }

  const columnOptions: ColumnType = {
    rowNumber: true,
    message: true
  }

  interface TableHeaderColumnInfoShouldUseMatUIType {
    id: keyof typeof columnOptions
    label: string
    minWidth: number
    align?: 'left' | 'right' | undefined
  }

  const columns: TableHeaderColumnInfoShouldUseMatUIType[] = [
    { id: 'rowNumber', label: 'Row Number', minWidth: 25 },
    { id: 'message', label: 'Student', minWidth: 100 }
  ]

  const renderTable = (): JSX.Element => {
    const [page, setPage] = React.useState<number>(0)
    const [rowsPerPage, setRowsPerPage] = React.useState(5)
    const emptyRows = rowsPerPage - Math.min(rowsPerPage, tableRows.length - page * rowsPerPage)

    const handleChangePage = (event, newPage: number): void => {
      setPage(newPage)
    }

    const handleChangeRowsPerPage = (event): void => {
      setRowsPerPage(parseInt(event.target.value, rowsPerPage))
      setPage(0)
    }

    function TablePaginationActions (props): JSX.Element {
      const classes = useStyles1()
      const theme = useTheme()
      const { count, page, rowsPerPage, onChangePage } = props

      const handleFirstPageButtonClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
        onChangePage(event, 0)
      }

      const handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
        onChangePage(event, page - 1)
      }

      const handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
        onChangePage(event, page + 1)
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
      <TableContainer className={classes.tableContainer} component={Paper}>
        <Table stickyHeader className={classes.table} aria-label="custom pagination table">
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
          <TableBody className={classes.tableBody}>
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

  return (
    <div className={classes.root}>
      <Typography variant='h5'>Convert Canvas Gradebook</Typography>
      <Grid container>
        <Grid item xs={7} hidden={tableHidden}>
          {renderTable()}
        </Grid>
        <Grid item xs={fileUploadColumns}>
          <FileUpload onUploadComplete={uploadComplete} labelText={fileUploadLabelText} action={fileUploadAction} primaryIcon={uploadIcon}></FileUpload>
        </Grid>
      </Grid>
    </div>
  )
}

export default ConvertCanvasGradebook
