import React, { useEffect, useState } from 'react'
import { Box, Grid, Link, makeStyles, Typography } from '@material-ui/core'
import WarningIcon from '@material-ui/icons/Warning'

import ConfirmDialog from '../components/ConfirmDialog'
import CSVFileName from '../components/CSVFileName'
import ErrorAlert from '../components/ErrorAlert'
import FileUpload from '../components/FileUpload'
import Help from '../components/Help'
import RowLevelErrorsContent from '../components/RowLevelErrorsContent'
import ValidationErrorTable from '../components/ValidationErrorTable'
import GradebookUploadConfirmationTable, { StudentGrade } from '../components/GradebookUploadConfirmationTable'
import { CurrentAndFinalGradeMatchGradebookValidator, GradebookRowInvalidation } from '../components/GradebookCanvasValidators'
import { canvasGradebookFormatterProps } from '../models/feature'
import { CCMComponentProps } from '../models/FeatureUIData'
import { DownloadData, InvalidationType } from '../models/models'
import CSVSchemaValidator, { SchemaInvalidation } from '../utils/CSVSchemaValidator'
import FileParserWrapper, { CSVRecord } from '../utils/FileParserWrapper'
import { createOutputFileName } from '../utils/fileUtils'

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
  table: {
    paddingLeft: 10,
    paddingRight: 10
  },
  dialogWarningIcon: {
    color: '#E2CF2A'
  }
}))

interface GradebookRecord extends CSVRecord {
  'CURRENT GRADE': string
  'FINAL GRADE': string
  'SIS LOGIN ID': string
  STUDENT: string
  'OVERRIDE GRADE': string | undefined
}

const isGradebookRecord = (record: CSVRecord): record is GradebookRecord => {
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

  // Would be nice to rework this so we know file is defined
  const getOutputFilename = (file: File | undefined): string => {
    if (file === undefined) return ''
    return createOutputFileName(file, '-geff')
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

  const handleParseComplete = (headers: string[] | undefined, data: CSVRecord[]): void => {
    const requiredHeaders = ['CURRENT GRADE', 'FINAL GRADE', 'SIS LOGIN ID', 'STUDENT']
    const csvValidator = new CSVSchemaValidator<GradebookRecord>(requiredHeaders, isGradebookRecord)

    const records = data.slice(1) // Remove Points Possible record
    const validationResult = csvValidator.validate(headers, records)
    if (!validationResult.valid) {
      if (headers !== undefined && (!headers.includes('FINAL GRADE') || !headers.includes('CURRENT GRADE'))) {
        return handleNoLetterGradesError()
      }
      return handleSchemaInvalidations(validationResult.schemaInvalidations)
    }

    const recordsToValidate = validationResult.validData.map(r => ({
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
      <Typography variant='h6' component='h2'>Upload your CSV File</Typography>
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
    const helpPath = props.globals.baseHelpURL
    const gradebookHelpURL = props.helpURLEnding
    return (
      <div>
        {file !== undefined && <CSVFileName file={file} />}
        <RowLevelErrorsContent
          table={<ValidationErrorTable invalidations={invalidations} />}
          title='Review your CSV file'
          message={(
            <Typography>
              There are likely blank cells in the course&apos;s gradebook.
              Please enter 0 or EX (for excused) for any blank cells in the gradebook, and export a new CSV file.
              Get <Link href={helpPath + gradebookHelpURL} target='_new' rel='noopener'>help</Link> with validation errors.
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

  const renderConfirm = (grades: StudentGrade[], overideGradeMismatchWarning: boolean): JSX.Element => {
    const warningIcon = <WarningIcon className={confirmationClasses.dialogWarningIcon} fontSize='large' />
    const warningText = (
      "Some assignment grades may be missing, but you've supplied an override grade. " +
      'If you wish to continue with the download, click "Submit"'
    )

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
            <Grid item xs={12} sm={3}>
              <ConfirmDialog
                message={overideGradeMismatchWarning ? warningText : undefined}
                icon={overideGradeMismatchWarning ? warningIcon : undefined}
                cancel={resetPageState}
                submit={() => undefined}
                download={downloadData}
              />
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
      <Help baseHelpURL={props.globals.baseHelpURL} helpURLEnding={props.helpURLEnding} />
      <Typography variant='h5' component='h1'>{canvasGradebookFormatterProps.title}</Typography>
      {renderComponent()}
    </div>
  )
}

export type { GradebookRecord }
export default ConvertCanvasGradebook
