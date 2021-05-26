import { Backdrop, Box, Button, CircularProgress, Grid, Link, makeStyles, Paper, Typography } from '@material-ui/core'
import CloudDoneIcon from '@material-ui/icons/CloudDone'
import ErrorIcon from '@material-ui/icons/Error'
import React, { useEffect, useState } from 'react'
import { getCourseSections } from '../api'
import BulkSectionCreateUploadConfirmationTable, { Section } from '../components/BulkSectionCreateUploadConfirmationTable'
import FileUpload from '../components/FileUpload'
import ValidationErrorTable from '../components/ValidationErrorTable'
import { createSectionsProps } from '../models/feature'
import { CCMComponentProps } from '../models/FeatureUIData'

const FILE_HEADER = 'SECTION_NAME'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: 25,
    textAlign: 'left',
    '& button': {
      margin: 5
    }
  },
  uploadContainer: {
    position: 'relative',
    zIndex: 0,
    textAlign: 'center'
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
    position: 'absolute'
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

const useAPIErrorStyles = makeStyles((theme) => ({
  dialog: {
    textAlign: 'center',
    maxWidth: '75%',
    margin: 'auto',
    marginTop: 30,
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

enum BulkSectionCreatePageState {
  LoadingExistingSectionNames,
  LoadingExistingSectionNamesFailed,
  Upload,
  InvalidUpload,
  Confirm,
  Done
}

interface BulkSectionCreatePageStateData {
  state: BulkSectionCreatePageState
  rowInvalidations: SectionsRowInvalidation[]
  schemaInvalidation: SectionsSchemaInvalidation[]
}

const isHeader = (text: string): boolean => {
  return text.toUpperCase() === FILE_HEADER.toUpperCase()
}

const hasHeader = (sectionNames: string[]): boolean => {
  return sectionNames.length > 0 && isHeader(sectionNames[0])
}

// Original requirement was to have a warning for missing header row, leaving this for now
enum InvalidationType {
  Error,
  Warning
}

interface SectionsSchemaInvalidation {
  error: string
  type: InvalidationType
}

// For validating schema level problems
interface SectionsSchemaValidator {
  validate: (sectionName: string[]) => SectionsSchemaInvalidation[]
}

class SectionNameHeaderValidator implements SectionsSchemaValidator {
  validate = (sectionNames: string[]): SectionsSchemaInvalidation[] => {
    const invalidations: SectionsSchemaInvalidation[] = []

    if (!hasHeader(sectionNames)) {
      invalidations.push({ error: 'Missing SECTION_NAME Header Row', type: InvalidationType.Error })
    }
    if (sectionNames.length === 0) {
      invalidations.push({ error: 'No data', type: InvalidationType.Error })
    }

    if (sectionNames.length === 1 && isHeader(sectionNames[0])) {
      invalidations.push({ error: 'No data', type: InvalidationType.Error })
    }
    return invalidations
  }
}

// For validating row level issues
interface SectionsRowInvalidation {
  message: string
  rowNumber: number
  type: InvalidationType
}

interface SectionRowsValidator {
  validate: (sectionName: string[]) => SectionsRowInvalidation[]
}

class DuplicateSectionInFileSectionRowsValidator implements SectionRowsValidator {
  validate = (sectionNames: string[]): SectionsRowInvalidation[] => {
    const sortedSectionNames = sectionNames.map(n => { return n.toUpperCase() }).sort((a, b) => { return a.localeCompare(b) })
    const duplicates: string[] = []
    for (let i = 1; i < sortedSectionNames.length; ++i) {
      if (sortedSectionNames[i - 1] === sortedSectionNames[i] && !duplicates.includes(sortedSectionNames[i])) {
        duplicates.push(sortedSectionNames[i])
      }
    }
    if (duplicates.length === 0) {
      return []
    }
    const invalidations: SectionsRowInvalidation[] = []
    let i = 1
    sectionNames.forEach(sectionName => {
      if (duplicates.includes(sectionName.toUpperCase())) {
        invalidations.push({ message: 'Duplicate section name: "' + sectionName + '"', rowNumber: i + 1, type: InvalidationType.Error })
      }
      ++i
    })
    return invalidations
  }
}

interface BulkSectionCreateProps extends CCMComponentProps {}

function BulkSectionCreate (props: BulkSectionCreateProps): JSX.Element {
  const classes = useStyles()
  const confirmationClasses = useConfirmationStyles()
  const rowLevelErrorClasses = useRowLevelErrorStyles()
  const topLevelClasses = useTopLevelErrorStyles()
  const apiErrorClasses = useAPIErrorStyles()

  const [isExistingSectionsLoading, setIsExistingSectionsLoading] = useState(true)
  const [pageState, setPageState] = useState<BulkSectionCreatePageStateData>({ state: BulkSectionCreatePageState.LoadingExistingSectionNames, schemaInvalidation: [], rowInvalidations: [] })
  const [file, setFile] = useState<File|undefined>(undefined)
  const [sectionNames, setSectionNames] = useState<string[]>([])
  const [existingSectionNames, setExistingSectionNames] = useState<string[]|undefined>(undefined)

  const loadCanvasSectionData = (): void => {
    getCourseSections(props.ltiKey, 'TODO-CourseNumberFromProps?')
      .then(sections => {
        setExistingSectionNames(sections.map(s => { return s.toUpperCase() }))
        setIsExistingSectionsLoading(false)
      }).catch(() => {
        setExistingSectionNames(undefined)
        setPageState({ state: BulkSectionCreatePageState.LoadingExistingSectionNamesFailed, schemaInvalidation: [], rowInvalidations: [] })
      })
  }

  // Support for this might be addressed by https://github.com/tl-its-umich-edu/canvas-course-manager-next/issues/74 ?
  useEffect(() => {
    loadCanvasSectionData()
  }, [])

  class DuplicateExistingSectionRowsValidator implements SectionRowsValidator {
    validate = (sectionNames: string[]): SectionsRowInvalidation[] => {
      const sortedSectionNames = sectionNames.map(n => { return n.toUpperCase() }).sort((a, b) => { return a.localeCompare(b) })
      const duplicates: string[] = []
      for (let i = 0; i < sortedSectionNames.length; ++i) {
        if ((existingSectionNames?.includes(sortedSectionNames[i])) ?? false) {
          duplicates.push(sortedSectionNames[i])
        }
      }

      const invalidations: SectionsRowInvalidation[] = []
      let i = 1
      sectionNames.forEach(sectionName => {
        if (duplicates.includes(sectionName.toUpperCase())) {
          invalidations.push({ message: 'Section name already used in canvas: "' + sectionName + '"', rowNumber: i + 1, type: InvalidationType.Error })
        }
        ++i
      })

      return invalidations
    }
  }

  const uploadComplete = (file: File): void => {
    setFile(file)
  }

  useEffect(() => {
    parseUpload(file)
  }, [file])

  const resetPageState = (): void => {
    setPageState({ state: BulkSectionCreatePageState.Upload, schemaInvalidation: [], rowInvalidations: [] })
  }

  const handleSchemaError = (schemaInvalidations: SectionsSchemaInvalidation[]): void => {
    setPageState({ state: BulkSectionCreatePageState.InvalidUpload, schemaInvalidation: schemaInvalidations, rowInvalidations: [] })
  }

  const handleRowLevelInvalidationError = (invalidations: SectionsRowInvalidation[]): void => {
    setPageState({ state: BulkSectionCreatePageState.InvalidUpload, schemaInvalidation: [], rowInvalidations: invalidations })
  }

  const handleParseSuccess = (sectionNames: string[]): void => {
    setSectionNames(sectionNames)
    setPageState({ state: BulkSectionCreatePageState.Confirm, schemaInvalidation: [], rowInvalidations: [] })
  }

  const parseUpload = (file: File|undefined): void => {
    if (file === undefined) {
      resetPageState()
      return
    }
    file.text().then(t => {
      let lines = t.split(/[\r\n]+/).map(line => { return line.trim() })
      // An empty file will resultin 1 line
      if (lines.length > 0 && lines[0].length === 0) {
        lines = lines.slice(1)
      }

      const schemaInvalidations: SectionsSchemaInvalidation[] = []

      const sectionNameHeaderValidator: SectionsSchemaValidator = new SectionNameHeaderValidator()
      schemaInvalidations.push(...sectionNameHeaderValidator.validate(lines))

      if (schemaInvalidations.length !== 0) {
        handleSchemaError(schemaInvalidations)
        return
      }

      if (hasHeader(lines)) {
        lines = lines.slice(1)
      }

      const rowInvalidations: SectionsRowInvalidation[] = []

      const duplicateNamesInFileValidator: SectionRowsValidator = new DuplicateSectionInFileSectionRowsValidator()
      rowInvalidations.push(...duplicateNamesInFileValidator.validate(lines))

      const duplicatesNamesInCanvasValidator: DuplicateExistingSectionRowsValidator = new DuplicateExistingSectionRowsValidator()
      rowInvalidations.push(...duplicatesNamesInCanvasValidator.validate(lines))

      if (rowInvalidations.length !== 0) {
        handleRowLevelInvalidationError(rowInvalidations)
        return
      }

      handleParseSuccess(lines)
    }).catch(e => {
      console.log(e)
      alert(e)
      // TODO Not sure how to produce this error in real life
      handleSchemaError([{ error: 'Error processing file', type: InvalidationType.Error }])
    })
  }

  const renderUploadHeader = (): JSX.Element => {
    return <div className={classes.uploadHeader}>
      <Typography variant='h6'>Upload your CSV File</Typography>
      <br/>
      <Typography><strong>Requirement:</strong> Your file should include one section name per line</Typography>
      <Typography>View a <Link href='#'>CSV File Example</Link></Typography>
    </div>
  }

  const renderFileUpload = (): JSX.Element => {
    return <div className={classes.uploadContainer}>
      <Grid container>
        <Grid item xs={12}>
          <FileUpload onUploadComplete={uploadComplete}></FileUpload>
        </Grid>
      </Grid>
      <Backdrop className={classes.backdrop} open={isExistingSectionsLoading}>
        <Grid container>
          <Grid item xs={12}>
            <CircularProgress color="inherit" />
          </Grid>
          <Grid item xs={12}>
          <Typography>Loading Section Information</Typography>
          </Grid>
        </Grid>
      </Backdrop>
    </div>
  }

  const renderUpload = (): JSX.Element => {
    return <div>
      {renderUploadHeader()}
      <br/>
      {renderFileUpload()}
    </div>
  }

  const renderCSVFileName = (): JSX.Element => {
    if (file !== undefined) {
      return (
        <h5 className={classes.fileNameContainer}>
          <Typography component='span'>File: </Typography><Typography component='span' className={classes.fileName}>{file.name}</Typography>
        </h5>
      )
    } else {
      return <></>
    }
  }

  const renderUploadAgainButton = (): JSX.Element => {
    return <Button color='primary' component="span" onClick={() => resetPageState()}>Upload again</Button>
  }

  const renderTryAgainButton = (): JSX.Element => {
    return <Button color='primary' component="span" onClick={() => { resetPageState(); loadCanvasSectionData() }}>Try again</Button>
  }

  const renderRowLevelErrors = (invalidations: SectionsRowInvalidation[]): JSX.Element => {
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
              <Paper role='alert'>
                <Typography>Review your CSV file</Typography>
                <ErrorIcon className={rowLevelErrorClasses.dialogIcon} fontSize='large'/>
                <Typography>Correct the file and{renderUploadAgainButton()}</Typography>
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
              <Typography>Correct the file and{renderUploadAgainButton()}</Typography>
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

  const renderInvalidUpload = (): JSX.Element => {
    let rowLevelErrors: JSX.Element | undefined
    let schemaLevelErrors: JSX.Element | undefined
    if (pageState.rowInvalidations.length > 0) {
      rowLevelErrors = renderRowLevelErrors(pageState.rowInvalidations)
    }
    if (pageState.schemaInvalidation.length > 0) {
      const schemaErrors: JSX.Element[] = pageState.schemaInvalidation.map((invalidation, i) => {
        return (<div key={i}>{invalidation.error}</div>)
      })
      schemaLevelErrors = <div>{renderTopLevelErrors(schemaErrors)}</div>
    }
    return (
      <div>
        {schemaLevelErrors !== undefined && schemaLevelErrors}
        {rowLevelErrors !== undefined && rowLevelErrors}
      </div>
    )
  }

  const renderAPIError = (): JSX.Element => {
    return (
      <Grid item xs={12} className={apiErrorClasses.dialog}>
        <Paper role='alert' >
          <ErrorIcon className={apiErrorClasses.dialogIcon} fontSize='large'/>
          <Typography>Sometheing went wrong.  Please try again later.</Typography>
          {renderTryAgainButton()}
        </Paper>
      </Grid>
    )
  }

  const renderConfirm = (sectionNames: Section[]): JSX.Element => {
    return (
      <div>
        {renderCSVFileName()}
        <Grid container>
          <Box clone order={{ xs: 2, sm: 1 }}>
            <Grid item xs={12} sm={9} className={confirmationClasses.table}>
              <BulkSectionCreateUploadConfirmationTable sectionNames={sectionNames} />
            </Grid>
          </Box>
          <Box clone order={{ xs: 1, sm: 2 }}>
            <Grid item xs={12} sm={3} className={confirmationClasses.dialog}>
              <Paper role='status'>
                <Typography>Review your CSV file</Typography>
                <CloudDoneIcon className={confirmationClasses.dialogIcon} fontSize='large'/>
                <Typography>Your file is valid!  If this looks correct proceed with download</Typography>
                <Button variant="outlined" onClick={(e) => resetPageState()}>Do Something</Button>
              </Paper>
            </Grid>
          </Box>
        </Grid>
      </div>)
  }

  const sectionNamesToSection = (sectionNames: string[]): Section[] => {
    return sectionNames.map((name, i) => { return { rowNumber: i + 1, sectionName: name } })
  }

  const renderComponent = (): JSX.Element => {
    switch (pageState.state) {
      case BulkSectionCreatePageState.LoadingExistingSectionNames:
        return renderUpload()
      case BulkSectionCreatePageState.LoadingExistingSectionNamesFailed:
        return renderAPIError()
      case BulkSectionCreatePageState.Upload:
        return renderUpload()
      case BulkSectionCreatePageState.InvalidUpload:
        return renderInvalidUpload()
      case BulkSectionCreatePageState.Confirm:
        return renderConfirm(sectionNamesToSection(sectionNames))
      case BulkSectionCreatePageState.Done:
        return (<div>DONE</div>)
      default:
        return <div>?</div>
    }
  }

  return (
    <div className={classes.root}>
      <Typography variant='h5'>{createSectionsProps.title}</Typography>
      {renderComponent()}
    </div>
  )
}

export default BulkSectionCreate