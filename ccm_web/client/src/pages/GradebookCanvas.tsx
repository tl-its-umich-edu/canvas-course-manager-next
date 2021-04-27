import React, { useEffect, useState } from 'react'
import { Box, Button, Grid, Link, makeStyles, Paper, Typography } from '@material-ui/core'
import CloudDoneIcon from '@material-ui/icons/CloudDone'
import ErrorIcon from '@material-ui/icons/Error'
import { parse, ParseResult } from 'papaparse'
import { useSnackbar } from 'notistack'

import FileUpload from '../components/FileUpload'
import ValidationErrorTable from '../components/ValidationErrorTable'
import ConfirmationTable, { StudentGrade } from '../components/ConfirmationTable'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: 25,
    textAlign: 'left'
  },
  fileName: {
    marginBottom: 15,
    paddingLeft: 10,
    paddingRight: 10
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
    paddingRight: 10
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
  errorMessage?: string[]
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

function ConvertCanvasGradebook (): JSX.Element {
  const classes = useStyles()
  const confirmationClasses = useConfirmationStyles()
  const rowLevelErrorClasses = useRowLevelErrorStyles()
  const topLevelClasses = useTopLevelErrorStyles()

  const { enqueueSnackbar } = useSnackbar()
  const [pageState, setPageState] = useState<GradebookCanvasPageStateData>({ state: GradebookCanvasPageState.Upload })
  const [file, setFile] = useState<File|undefined>(undefined)

  useEffect(() => {
    if (pageState.errorMessage !== undefined) {
      enqueueSnackbar(pageState.errorMessage.join('  '), { variant: 'error' })
    }
  }, [pageState])

  const uploadComplete = (file: File): void => {
    setFile(file)
    parseUpload(file)
  }

  const parseUpload = (file: File): void => {
    // This results in an error on the 2nd "header" row for possible scores
    parse<GradebookRecord>(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        handleParseComplete(results)
      }

    })
  }

  const handleNoLetterGradesError = (): void => {
    setPageState({ state: GradebookCanvasPageState.InvalidUpload, errorMessage: ['Your file needs to include grade letter (A-E)', 'Change your grading scheme in settings'] })
  }

  const handleRowLevelInvalidationError = (errorMessage: string[], invalidations: GradebookRowInvalidation[]): void => {
    setPageState({ state: GradebookCanvasPageState.InvalidUpload, invalidations: invalidations, errorMessage: errorMessage })
  }

  const handleParseSuccess = (grades: GradebookRecord[]): void => {
    setPageState({ state: GradebookCanvasPageState.Confirm, grades: grades })
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
      handleRowLevelInvalidationError(['There are blank cells in the gradebook. Please enter 0 or EX (for excused) for any blank cells in the gradebook and export a new CSV file.'], invalidations)
    } else {
      handleParseSuccess(data)
    }
  }

  const renderUploadHeader = (): JSX.Element => {
    return <span>
      <Typography variant='h6'>Upload your CSV File</Typography>
      <Typography>The CSV file will be formatted by trimming out nonessential columns.</Typography>
      <br/>
      <Typography><strong>Requirement needed:</strong> <Link href='#'>Grading Scheme in settings</Link> needs to be check marked for letter grade to appear in the CSV file.</Typography>
    </span>
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
              <Paper>
                <Typography>Review your CSV file</Typography>
                <ErrorIcon className={rowLevelErrorClasses.dialogIcon} fontSize='large'/>
                <Typography>Correct the file first and <Link href='#'>Upload again</Link></Typography>
              </Paper>
            </Grid>
          </Box>
        </Grid>
      </div>)
  }

  const renderTopLevelErrors = (errors: string[]): JSX.Element => {
    return (
      <div>
        {renderCSVFileName()}
        <Grid container justify='flex-start'>
          <Grid item xs={12} className={topLevelClasses.dialog}>
            <Paper>
              <Typography>Review your CSV file</Typography>
              <ErrorIcon className={topLevelClasses.dialogIcon} fontSize='large'/>
              <div>
                {errors.map(e => {
                  return <div key={errors.indexOf(e)}><Typography>{e}</Typography></div>
                })}
              </div>
            </Paper>
          </Grid>
        </Grid>
      </div>)
  }

  const renderCSVFileName = (): JSX.Element => {
    if (file !== undefined) {
      return <div className={classes.fileName}>CSV File: {file.name}</div>
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
              <Paper>
                <Typography>Review your CSV file</Typography>
                <CloudDoneIcon className={confirmationClasses.dialogIcon} fontSize='large'/>
                <Typography>Your {file === undefined ? '' : file.name} file is valid!  If this is the right file you want ot upload click Submit File</Typography>
                <Button variant="contained">Cancel</Button>
                <Button variant="contained">Submit File</Button>
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
