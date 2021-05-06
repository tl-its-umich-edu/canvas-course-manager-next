import React, { useEffect, useState } from 'react'
import { Box, Button, Grid, Link, makeStyles, Paper, Typography } from '@material-ui/core'
import CloudDoneIcon from '@material-ui/icons/CloudDone'
import ErrorIcon from '@material-ui/icons/Error'
import { parse, ParseResult } from 'papaparse'
// import { useSnackbar } from 'notistack'

import FileUpload from '../components/FileUpload'
import ValidationErrorTable from '../components/ValidationErrorTable'
import ConfirmationTable, { StudentGrade } from '../components/ConfirmationTable'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: 25,
    textAlign: 'left',
    '& button': {
      margin: 5
    }
  },
  fileNameContainer: {
    marginBottom: 15,
    paddingLeft: 10,
    paddingRight: 10
  },
  fileName: {
    color: '#3F648E',
    fontFamily: 'monospace'
  },
  uploadHeader: {
    paddingTop: 15
  }
}))

const useConfirmationStyles = makeStyles((theme) => ({
  dialog: {
    textAlign: 'center',
    marginBottom: 15,
    paddingLeft: 10,
    paddingRight: 10
  },
  table: {
    paddingLeft: 10,
    paddingRight: 10
  },
  dialogIcon: {
    color: '#3F648E'
  }
}))

const useRowLevelErrorStyles = makeStyles((theme) => ({
  dialog: {
    textAlign: 'center',
    marginBottom: 15,
    paddingLeft: 10,
    paddingRight: 10
  },
  table: {
    paddingLeft: 10,
    paddingRight: 10
  },
  dialogIcon: {
    color: 'red'
  }
}))

const useTopLevelErrorStyles = makeStyles((theme) => ({
  dialog: {
    textAlign: 'center',
    marginBottom: 15,
    paddingLeft: 10,
    paddingRight: 10,
    // marginLeft: 'auto',
    // marginRight: 'auto',
    width: '75%',
    '& ol': {
      margin: 'auto',
      width: '75%'
    },
    '& li': {
      textAlign: 'left'
    }
  },
  dialogIcon: {
    color: 'red'
  }
}))

interface GradebookRecord {
  'Current Grade': string
  'Final Grade': string
  'SIS Login ID': string
  grade: string | undefined
  Student: string
}

interface GradebookCanvasPageStateData {
  state: GradebookCanvasPageState
  invalidations?: GradebookRowInvalidation[] | undefined
  errorMessage?: JSX.Element[]
  grades?: GradebookRecord[]
}

enum GradebookCanvasPageState {
  Upload,
  InvalidUpload,
  Confirm,
  Done
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

interface DownloadData {
  data: string
  fileName: string
}

function ConvertCanvasGradebook (): JSX.Element {
  const classes = useStyles()
  const confirmationClasses = useConfirmationStyles()
  const rowLevelErrorClasses = useRowLevelErrorStyles()
  const topLevelClasses = useTopLevelErrorStyles()

  // const { enqueueSnackbar } = useSnackbar()
  const [pageState, setPageState] = useState<GradebookCanvasPageStateData>({ state: GradebookCanvasPageState.Upload })
  const [file, setFile] = useState<File|undefined>(undefined)
  const [downloadData, setDownloadData] = useState<DownloadData|undefined>(undefined)

  // useEffect(() => {
  //   if (pageState.errorMessage !== undefined) {
  //     enqueueSnackbar(pageState.errorMessage.join('  '), { variant: 'error' })
  //   }
  // }, [pageState])

  const uploadComplete = (file: File): void => {
    setFile(file)
    // parseUpload(file)
  }

  useEffect(() => {
    parseUpload(file)
  }, [file])

  const parseUpload = (file: File|undefined): void => {
    if (file === undefined) {
      resetPageState()
      return
    }
    // This results in an error on the 2nd "header" row for possible scores
    parse<GradebookRecord>(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        handleParseComplete(results)
      }

    })
  }

  const resetPageState = (): void => {
    setPageState({ state: GradebookCanvasPageState.Upload })
  }

  const getOutputFilename = (file: File | undefined): string => {
    if (file === undefined) return ''
    const splitName = file.name.split('.')
    const filenameIndex = splitName.length >= 2 ? splitName.length - 2 : 0
    splitName[filenameIndex] = splitName[filenameIndex] + '-geff'
    return splitName.join('.')
  }

  const setCSVtoDownload = (data: GradebookRecord[]): void => {
    let csvContent = 'data:text/csv;charset=utf-8,'
    data.forEach(function (record, index) {
      csvContent += record['SIS Login ID'] + ',' + record['Final Grade'] + (index < data.length ? '\n' : '')
    })
    setDownloadData({ data: encodeURI(csvContent), fileName: getOutputFilename(file) })
  }

  const handleNoLetterGradesError = (): void => {
    setPageState({ state: GradebookCanvasPageState.InvalidUpload, errorMessage: [<Typography key='0'><Link href='#'>Grading Scheme in settings</Link> needs to be check marked for letter grade to appear in the CSV file.</Typography>, <Typography key='1'>{renderUploadAgainButton()}</Typography>] })
  }

  const handleRowLevelInvalidationError = (errorMessage: JSX.Element[], invalidations: GradebookRowInvalidation[]): void => {
    setPageState({ state: GradebookCanvasPageState.InvalidUpload, invalidations: invalidations, errorMessage: errorMessage })
  }

  const handleParseSuccess = (grades: GradebookRecord[]): void => {
    setPageState({ state: GradebookCanvasPageState.Confirm, grades: grades })
    setCSVtoDownload(grades)
  }

  const handleParseComplete = (results: ParseResult<GradebookRecord>): void => {
    const data = results.data.slice(1) // The first row is possible scores

    if (data[0]['Final Grade'] === undefined) {
      handleNoLetterGradesError()
      return
    }

    let invalidations: GradebookRowInvalidation[] = []

    const gradeMismatchValidator = new CurrentAndFinalGradeMatchGradebookValidator()

    data.forEach(record => {
      invalidations = invalidations.concat(gradeMismatchValidator.validate(record, data.indexOf(record) + 1))
    })

    if (invalidations.length > 0) {
      handleRowLevelInvalidationError([<div key='0'>There are blank cells in the gradebook. Please enter 0 or EX (for excused) for any blank cells in the gradebook and export a new CSV file.</div>], invalidations)
    } else {
      handleParseSuccess(data)
    }
  }

  const renderUploadHeader = (): JSX.Element => {
    return <div className={classes.uploadHeader}>
      <Typography variant='h6'>Upload your CSV File</Typography>
      <Typography>The CSV file will be formatted by trimming out nonessential columns.</Typography>
      <br/>
      <Typography><strong>Requirement needed:</strong> <Link href='#'>Grading Scheme in settings</Link> needs to be check marked for letter grade to appear in the CSV file.</Typography>
    </div>
  }

  const renderFileUpload = (): JSX.Element => {
    return <span>
      <Grid container>
        <Grid item xs={12}>
          <FileUpload onUploadComplete={uploadComplete}></FileUpload>
        </Grid>
      </Grid>
    </span>
  }

  const renderUpload = (): JSX.Element => {
    return <span>
      {renderUploadHeader()}
      <br/>
      {renderFileUpload()}
    </span>
  }

  const renderUploadAgainButton = (): JSX.Element => {
    return <Button color='primary' component="span" onClick={() => resetPageState()}>Upload again</Button>
  }
  const renderRowLevelErrors = (invalidations: GradebookRowInvalidation[]): JSX.Element => {
    return (
      <div>
        {renderCSVFileName()}
        <Grid container justify='flex-start'>
          <Box clone order={{ xs: 2, sm: 1 }}>
            <Grid item xs={12} sm={9} className={rowLevelErrorClasses.table} >
              <ValidationErrorTable invalidations={invalidations} />
            </Grid>
          </Box>
          <Box clone order={{ xs: 1, sm: 2 }}>
            <Grid item xs={12} sm={3} className={rowLevelErrorClasses.dialog}>
              <Paper role='alert' >
                <Typography>Review your CSV file</Typography>
                <ErrorIcon className={rowLevelErrorClasses.dialogIcon} fontSize='large'/>
                <Typography>Correct the file first and{renderUploadAgainButton()}</Typography>
              </Paper>
            </Grid>
          </Box>
        </Grid>
      </div>)
  }

  const renderTopLevelErrors = (errors: JSX.Element[]): JSX.Element => {
    return (
      <div>
        {renderCSVFileName()}
        <Grid container justify='flex-start'>
          <Grid item xs={12} className={topLevelClasses.dialog}>
            <Paper role='alert'>
              <Typography>Review your CSV file</Typography>
              <ErrorIcon className={topLevelClasses.dialogIcon} fontSize='large'/>
              <ol>
                {errors.map(e => {
                  return (<li key={e.key}>{e}</li>)
                })}
              </ol>
            </Paper>
          </Grid>
        </Grid>
      </div>)
  }

  const renderCSVFileName = (): JSX.Element => {
    if (file !== undefined) {
      return (<h5 className={classes.fileNameContainer}><Typography component='span'>File: </Typography><Typography component='span' className={classes.fileName}>{file.name}</Typography></h5>)
    } else {
      return <></>
    }
  }

  const renderInvalidUpload = (): JSX.Element => {
    if (pageState.invalidations !== undefined) {
      return renderRowLevelErrors(pageState.invalidations)
    } else if (pageState.errorMessage !== undefined) {
      return renderTopLevelErrors(pageState.errorMessage)
    } else {
      return <div>?</div>
    }
  }

  const renderConfirm = (grades: StudentGrade[]): JSX.Element => {
    return (
      <div>
        {renderCSVFileName()}
        <Grid container>
          <Box clone order={{ xs: 2, sm: 1 }}>
            <Grid item xs={12} sm={9} className={confirmationClasses.table}>
              <ConfirmationTable grades={grades} />
            </Grid>
          </Box>
          <Box clone order={{ xs: 1, sm: 2 }}>
            <Grid item xs={12} sm={3} className={confirmationClasses.dialog}>
              <Paper role='status'>
                <Typography>Review your CSV file</Typography>
                <CloudDoneIcon className={confirmationClasses.dialogIcon} fontSize='large'/>
                <Typography>Your file is valid!  If this looks correct proceed with download</Typography>
                <Button variant="outlined" onClick={(e) => resetPageState()}>Cancel</Button>
                <Link href={downloadData?.data} download={downloadData?.fileName}>
                  <Button disabled={downloadData === undefined} variant='outlined' color='primary'>Download</Button>
                </Link>
              </Paper>
            </Grid>
          </Box>
        </Grid>
      </div>)
  }

  const renderDone = (): JSX.Element => {
    return <div>Done</div>
  }

  const gradeBookRecordToStudentGrade = (grades: GradebookRecord[] | undefined): StudentGrade[] => {
    if (grades === undefined) {
      return []
    }
    return grades.map<StudentGrade>(g => {
      return { rowNumber: grades.indexOf(g) + 1, uniqname: g.Student, grade: g['Final Grade'] }
    })
  }

  const renderComponent = (): JSX.Element => {
    switch (pageState.state) {
      case GradebookCanvasPageState.Upload:
        return renderUpload()
      case GradebookCanvasPageState.InvalidUpload:
        return renderInvalidUpload()
      case GradebookCanvasPageState.Confirm:
        return renderConfirm(gradeBookRecordToStudentGrade(pageState.grades))
      case GradebookCanvasPageState.Done:
        return renderDone()
      default:
        return <div>?</div>
    }
  }

  return (
    <div className={classes.root}>
      <Typography variant='h5'>Convert Canvas Gradebook</Typography>
      {renderComponent()}
    </div>
  )
}

export default ConvertCanvasGradebook
