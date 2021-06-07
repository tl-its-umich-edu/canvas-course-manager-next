import React, { useEffect, useState } from 'react'
import { Box, Button, Grid, Link, makeStyles, Paper, Typography } from '@material-ui/core'
import CloudDoneIcon from '@material-ui/icons/CloudDone'
import ErrorIcon from '@material-ui/icons/Error'
import WarningIcon from '@material-ui/icons/Warning'
import { parse, ParseResult } from 'papaparse'

import FileUpload from '../components/FileUpload'
import ValidationErrorTable from '../components/ValidationErrorTable'
import GradebookUploadConfirmationTable, { StudentGrade } from '../components/GradebookUploadConfirmationTable'
import { canvasGradebookFormatterProps } from '../models/feature'
import { CurrentAndFinalGradeMatchGradebookValidator, GradbookRowInvalidationType, GradebookRowInvalidation } from '../components/GradebookCanvasValidators'

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
  },
  dialogWarningIcon: {
    color: '#e2cf2a'
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
    maxWidth: '75%',
    margin: 'auto',
    marginBottom: 15,
    paddingLeft: 10,
    paddingRight: 10,
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
  'Override Grade': string | undefined
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

interface DownloadData {
  data: string
  fileName: string
}

function ConvertCanvasGradebook (): JSX.Element {
  const classes = useStyles()
  const confirmationClasses = useConfirmationStyles()
  const rowLevelErrorClasses = useRowLevelErrorStyles()
  const topLevelClasses = useTopLevelErrorStyles()

  const [pageState, setPageState] = useState<GradebookCanvasPageStateData>({ state: GradebookCanvasPageState.Upload })
  const [file, setFile] = useState<File|undefined>(undefined)
  const [downloadData, setDownloadData] = useState<DownloadData|undefined>(undefined)

  const uploadComplete = (file: File): void => {
    setFile(file)
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

  const getGradeForExport = (record: GradebookRecord): string => {
    return record['Override Grade'] !== undefined ? record['Override Grade'] : record['Final Grade']
  }

  const setCSVtoDownload = (data: GradebookRecord[]): void => {
    let csvContent = 'data:text/csv;charset=utf-8,'
    data.forEach(function (record, index) {
      csvContent += record['SIS Login ID'] + ',' + getGradeForExport(record) + (index < data.length ? '\n' : '')
    })
    setDownloadData({ data: encodeURI(csvContent), fileName: getOutputFilename(file) })
  }

  const handleNoLetterGradesError = (): void => {
    setPageState({ state: GradebookCanvasPageState.InvalidUpload, errorMessage: [<Typography key='0'><Link href='#'>Grading Scheme in settings</Link> needs to be check marked for letter grade to appear in the CSV file.</Typography>, <Typography key='1'>{renderUploadAgainButton()}</Typography>] })
  }

  const handleRowLevelInvalidationError = (errorMessage: JSX.Element[], invalidations: GradebookRowInvalidation[]): void => {
    setPageState({ state: GradebookCanvasPageState.InvalidUpload, invalidations: invalidations, errorMessage: errorMessage })
  }

  const handleParseSuccess = (grades: GradebookRecord[], warnings: GradebookRowInvalidation[]): void => {
    setPageState({ state: GradebookCanvasPageState.Confirm, grades: grades, invalidations: warnings })
    setCSVtoDownload(grades)
  }

  const handleParseComplete = (results: ParseResult<GradebookRecord>): void => {
    const data = results.data.slice(1).map(d => { return { ...d, 'Override Grade': (d['Override Grade'] !== undefined && d['Override Grade'].trim().length > 0) ? d['Override Grade'] : undefined } }) // The first row is possible scores

    if (data[0]['Final Grade'] === undefined) {
      handleNoLetterGradesError()
      return
    }

    let invalidations: GradebookRowInvalidation[] = []

    const gradeMismatchValidator = new CurrentAndFinalGradeMatchGradebookValidator()

    data.forEach(record => {
      invalidations = invalidations.concat(gradeMismatchValidator.validate(record, data.indexOf(record) + 1 + 2)) // Add 2 because of 2 header rows
    })

    if (invalidations.filter(i => { return i.type === GradbookRowInvalidationType.ERROR }).length > 0) {
      handleRowLevelInvalidationError([<div key='0'>There are blank cells in the gradebook. Please enter 0 or EX (for excused) for any blank cells in the gradebook and export a new CSV file.</div>], invalidations)
    } else {
      handleParseSuccess(data, invalidations.filter(i => { return i.type === GradbookRowInvalidationType.WARNING }))
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

  const renderConfirmIcon = (isWarning: boolean): JSX.Element => {
    if (isWarning) {
      return (<WarningIcon className={confirmationClasses.dialogWarningIcon} fontSize='large'/>)
    } else {
      return (<CloudDoneIcon className={confirmationClasses.dialogIcon} fontSize='large'/>)
    }
  }

  const renderConfirmText = (isWarning: boolean): JSX.Element => {
    if (isWarning) {
      return (<Typography>Some assignment grades may be missing, but you’ve supplied an override grade. Continue?</Typography>)
    } else {
      return (<Typography>Your file is valid!  If this looks correct proceed with download</Typography>)
    }
  }

  const renderConfirm = (grades: StudentGrade[], overideGradeMismatchWarning: boolean): JSX.Element => {
    return (
      <div>
        {renderCSVFileName()}
        <Grid container>
          <Box clone order={{ xs: 2, sm: 1 }}>
            <Grid item xs={12} sm={9} className={confirmationClasses.table}>
              <GradebookUploadConfirmationTable grades={grades} />
            </Grid>
          </Box>
          <Box clone order={{ xs: 1, sm: 2 }}>
            <Grid item xs={12} sm={3} className={confirmationClasses.dialog}>
              <Paper role='status'>
                <Typography>Review your CSV file</Typography>
                {renderConfirmIcon(overideGradeMismatchWarning)}
                {renderConfirmText(overideGradeMismatchWarning)}
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
      return { rowNumber: grades.indexOf(g) + 1 + 2, uniqname: g.Student, grade: g['Final Grade'], overrideGrade: g['Override Grade'] } // Add 2 because of 2 header rows
    })
  }

  const renderComponent = (): JSX.Element => {
    switch (pageState.state) {
      case GradebookCanvasPageState.Upload:
        return renderUpload()
      case GradebookCanvasPageState.InvalidUpload:
        return renderInvalidUpload()
      case GradebookCanvasPageState.Confirm:
        return renderConfirm(gradeBookRecordToStudentGrade(pageState.grades), (pageState.invalidations !== undefined && pageState.invalidations.length > 0))
      case GradebookCanvasPageState.Done:
        return renderDone()
      default:
        return <div>?</div>
    }
  }

  return (
    <div className={classes.root}>
      <Typography variant='h5'>{canvasGradebookFormatterProps.title}</Typography>
      {renderComponent()}
    </div>
  )
}

export type { GradebookRecord }
export default ConvertCanvasGradebook
