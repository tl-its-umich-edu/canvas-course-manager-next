import React, { useEffect, useState } from 'react'
import { Box, Button, Grid, Link, makeStyles, Paper, Typography } from '@material-ui/core'
import CloudDoneIcon from '@material-ui/icons/CloudDone'
import WarningIcon from '@material-ui/icons/Warning'

import CSVFileName from '../components/CSVFileName'
import ErrorAlert from '../components/ErrorAlert'
import FileUpload from '../components/FileUpload'
import RowLevelErrorsContent from '../components/RowLevelErrorsContent'
import ValidationErrorTable from '../components/ValidationErrorTable'
import GradebookUploadConfirmationTable, { StudentGrade } from '../components/GradebookUploadConfirmationTable'
import { CurrentAndFinalGradeMatchGradebookValidator, GradebookRowInvalidation } from '../components/GradebookCanvasValidators'
import { canvasGradebookFormatterProps } from '../models/feature'
import { CCMComponentProps } from '../models/FeatureUIData'
import { InvalidationType } from '../models/models'
import CSVSchemaValidator, { SchemaInvalidation } from '../utils/CSVSchemaValidator'
import FileParserWrapper, { UnknownCSVRecord } from '../utils/FileParserWrapper'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: 25,
    textAlign: 'left',
    '& button': {
      margin: 5
    }
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

interface GradebookRecord extends UnknownCSVRecord {
  'CURRENT GRADE': string
  'FINAL GRADE': string
  'SIS LOGIN ID': string
  STUDENT: string
  'OVERRIDE GRADE': string | undefined
}

const isGradebookRecord = (record: UnknownCSVRecord): record is GradebookRecord => {
  return (
    typeof record['CURRENT GRADE'] === 'string' &&
    typeof record['FINAL GRADE'] === 'string' &&
    typeof record['SIS LOGIN ID'] === 'string' &&
    typeof record.STUDENT === 'string'
  )
}

interface GradebookCanvasPageStateData {
  state: GradebookCanvasPageState
  invalidations?: GradebookRowInvalidation[]
  errorMessages?: JSX.Element[]
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

const convertEmptyCellToUndefined = (cell: string | undefined): string | undefined => {
  if (cell !== undefined && cell.trim().length === 0) return undefined
  return cell
}

function ConvertCanvasGradebook (props: CCMComponentProps): JSX.Element {
  const classes = useStyles()
  const confirmationClasses = useConfirmationStyles()

  const [pageState, setPageState] = useState<GradebookCanvasPageStateData>({ state: GradebookCanvasPageState.Upload })
  const [file, setFile] = useState<File|undefined>(undefined)
  const [downloadData, setDownloadData] = useState<DownloadData | undefined>(undefined)

  const fileParser = new FileParserWrapper()

  const uploadComplete = (file: File): void => {
    setFile(file)
  }

  const parseUpload = (file: File): void => {
    fileParser.parseCSV(
      file,
      handleParseComplete,
      (message) => setPageState({
        state: GradebookCanvasPageState.Upload, errorMessages: [<Typography key='0'>{message}</Typography>]
      })
    )
  }

  useEffect(() => {
    if (file !== undefined) {
      parseUpload(file)
    }
  }, [file])

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
    return record['OVERRIDE GRADE'] !== undefined ? record['OVERRIDE GRADE'] : record['FINAL GRADE']
  }

  const setCSVtoDownload = (data: GradebookRecord[]): void => {
    const csvData = data.map(r => [r['SIS LOGIN ID'], getGradeForExport(r)])
    const csvString = 'data:text/csv;charset=utf-8,' + fileParser.createCSV(csvData)
    setDownloadData({ data: encodeURI(csvString), fileName: getOutputFilename(file) })
  }

  const handleInvalidUpload = (errorMessages?: JSX.Element[], invalidations?: GradebookRowInvalidation[]): void => {
    setPageState({ state: GradebookCanvasPageState.InvalidUpload, invalidations, errorMessages })
  }

  const handleNoLetterGradesError = (): void => {
    const { canvasURL, course } = props.globals
    const settingsURL = `${canvasURL}/courses/${course.id}/settings#course_grading_standard_enabled`
    const errorMessage = (
      <Typography key='0'>
        The Canvas gradebook export CSV you uploaded does not include letter grades. To add them,
        ensure <Link href={settingsURL} target='_parent'>Grading Scheme in settings</Link> for your course
        is checked, and then re-export the gradebook.
      </Typography>
    )
    return handleInvalidUpload([errorMessage])
  }

  const handleSchemaInvalidations = (invalidations: SchemaInvalidation[]): void => {
    handleInvalidUpload(invalidations.map((invalidation, i) => <Typography key={i}>{invalidation.message}</Typography>))
  }

  const handleParseSuccess = (grades: GradebookRecord[], warnings: GradebookRowInvalidation[]): void => {
    setPageState({ state: GradebookCanvasPageState.Confirm, grades: grades, invalidations: warnings })
    setCSVtoDownload(grades)
  }

  const handleParseComplete = (headers: string[] | undefined, data: UnknownCSVRecord[]): void => {
    const requiredHeaders = ['CURRENT GRADE', 'FINAL GRADE', 'SIS LOGIN ID', 'STUDENT']
    const csvValidator = new CSVSchemaValidator<GradebookRecord>(requiredHeaders, isGradebookRecord)

    const records = data.slice(1) // Remove Points Possible record
    const schemaInvalidations = csvValidator.validate(headers, records)
    let gradebookRecords: GradebookRecord[] | undefined
    if (csvValidator.checkRecordShapes(records)) {
      gradebookRecords = records
    } else if (csvValidator.validateHeaders(headers) === undefined) {
      schemaInvalidations.push(CSVSchemaValidator.recordShapeInvalidation)
    }

    if (gradebookRecords === undefined || schemaInvalidations.length > 0) {
      if (headers !== undefined && (!headers.includes('FINAL GRADE') || !headers.includes('CURRENT GRADE'))) {
        return handleNoLetterGradesError()
      }
      return handleSchemaInvalidations(schemaInvalidations)
    }

    const recordsToValidate = gradebookRecords.map(r => ({
      ...r,
      'OVERRIDE GRADE': convertEmptyCellToUndefined(r['OVERRIDE GRADE'])
    }))

    let rowInvalidations: GradebookRowInvalidation[] = []
    const gradeMismatchValidator = new CurrentAndFinalGradeMatchGradebookValidator()

    recordsToValidate.forEach(record => {
      rowInvalidations = rowInvalidations.concat(
        gradeMismatchValidator.validate(record, recordsToValidate.indexOf(record) + 1 + 2) // Add 2 because of 2 header rows
      )
    })

    if (rowInvalidations.filter(i => i.type === InvalidationType.Error).length > 0) {
      handleInvalidUpload(undefined, rowInvalidations)
    } else {
      handleParseSuccess(recordsToValidate, rowInvalidations.filter(i => i.type === InvalidationType.Warning))
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
        <li><Typography><Link href='https://community.canvaslms.com/t5/Instructor-Guide/How-do-I-export-grades-in-the-Gradebook/ta-p/809' target='_blank' rel="noopener">You have exported (downloaded) the completed Canvas gradebook.</Link></Typography></li>
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

  const renderRowLevelErrors = (invalidations: GradebookRowInvalidation[]): JSX.Element => {
    return (
      <div>
        {file !== undefined && <CSVFileName file={file} />}
        <RowLevelErrorsContent
          table={<ValidationErrorTable invalidations={invalidations} />}
          title='Some errors occurred'
          errorType='error'
          message={(
            <Typography>
              There are likely blank cells in the course&apos;s gradebook.
              Please enter 0 or EX (for excused) for any blank cells in the gradebook, and export a new CSV file.
              Get <Link href='#' target='_new' rel='noopener'>help</Link> with validation errors.
            </Typography>
          )}
          resetUpload={resetPageState}
        />
      </div>
    )
  }

  const renderTopLevelErrors = (errors: JSX.Element[]): JSX.Element => {
    return (
      <div>
        {file !== undefined && <CSVFileName file={file} />}
        <ErrorAlert messages={errors} tryAgain={resetPageState} />
      </div>
    )
  }

  const renderInvalidUpload = (): JSX.Element => {
    if (pageState.errorMessages !== undefined) {
      return renderTopLevelErrors(pageState.errorMessages)
    } else if (pageState.invalidations !== undefined) {
      return renderRowLevelErrors(pageState.invalidations)
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
        {file !== undefined && <CSVFileName file={file} />}
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
      return { rowNumber: grades.indexOf(g) + 1 + 2, uniqname: g['SIS LOGIN ID'], grade: g['FINAL GRADE'], overrideGrade: g['OVERRIDE GRADE'] } // Add 2 because of 2 header rows
    })
  }

  const renderComponent = (): JSX.Element => {
    switch (pageState.state) {
      case GradebookCanvasPageState.Upload:
        return renderUpload()
      case GradebookCanvasPageState.InvalidUpload:
        return renderInvalidUpload()
      case GradebookCanvasPageState.Confirm:
        return renderConfirm(
          gradeBookRecordToStudentGrade(pageState.grades),
          (pageState.invalidations !== undefined && pageState.invalidations.length > 0)
        )
      case GradebookCanvasPageState.Done:
        return renderDone()
      default:
        return <div>?</div>
    }
  }

  return (
    <div className={classes.root}>
      <Typography variant='h5' component='h1'>{canvasGradebookFormatterProps.title}</Typography>
      {renderComponent()}
    </div>
  )
}

export type { GradebookRecord }
export default ConvertCanvasGradebook
