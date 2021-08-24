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
import { CCMComponentProps } from '../models/FeatureUIData'

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
    '& ul': {
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

function ConvertCanvasGradebook (props: CCMComponentProps): JSX.Element {
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
    const { canvasURL, course } = props.globals
    const settingsURL = `${canvasURL}/courses/${course.id}/settings`
    setPageState({ state: GradebookCanvasPageState.InvalidUpload, errorMessage: [<Typography key='0'><Link href={settingsURL} target='_new' rel='noopener'>Grading Scheme in settings</Link> needs to be check marked for letter grade to appear in the CSV file.</Typography>] })
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
      <Typography>This tool reformats an exported Canvas gradebook file for upload to Faculty Center.</Typography>
      <br/>
      <Typography><strong>Requirements</strong></Typography>
      <ol>
        <li><Typography><Link href='https://community.canvaslms.com/t5/Instructor-Guide/tkb-p/Instructor#Grades' target='_blank' rel="noopener">All assignments are graded.</Link></Typography></li>
        <li><Typography><Link href='https://community.canvaslms.com/t5/Instructor-Guide/How-do-I-enable-a-grading-scheme-for-a-course/ta-p/1042' target='_blank' rel="noopener">Grading scheme must be enabled in your course settings.</Link></Typography></li>
        <li><Typography><Link href='https://community.canvaslms.com/t5/Instructor-Guide/How-do-I-export-grades-in-the-Gradebook/ta-p/809' target='_blank' rel="noopener">You have exported (downloaded) the completed Canvas gradebook</Link></Typography></li>
      </ol>
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
                <ErrorIcon className={rowLevelErrorClasses.dialogIcon} fontSize='large'/>
                <Typography>Get <Link href='#' target='_new' rel='noopener'>help</Link> with validation errors</Typography>
                <Typography>{renderUploadAgainButton()}</Typography>
              </Paper>
            </Grid>
          </Box>
        </Grid>
      </div>)
  }

  const renderTopLevelErrors = (errors: JSX.Element[]): JSX.Element => {
    const errorListItems = errors.map(e => {
      return (<li key={e.key}>{e}</li>)
    })
    const errorList = errors.length > 1 ? <ol>{errorListItems}</ol> : <ul>{errorListItems}</ul>
    return (
      <div>
        {renderCSVFileName()}
        <Grid container justify='flex-start'>
          <Grid item xs={12} className={topLevelClasses.dialog}>
            <Paper role='alert'>
              <ErrorIcon className={topLevelClasses.dialogIcon} fontSize='large'/>
              {errorList}
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
      return (<Typography>File validation successful.</Typography>)
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
