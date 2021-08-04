import { Backdrop, Box, Button, Card, CardActions, CardContent, CircularProgress, Grid, makeStyles, Paper, Typography } from '@material-ui/core'
import { CloudDone as CloudDoneIcon, CheckCircle, Error as ErrorIcon, Warning } from '@material-ui/icons'
import React, { useEffect, useState } from 'react'
import { addCourseSections, getCourseSections } from '../api'
import BulkSectionCreateUploadConfirmationTable, { Section } from '../components/BulkSectionCreateUploadConfirmationTable'
import FileUpload from '../components/FileUpload'
import ValidationErrorTable from '../components/ValidationErrorTable'
import usePromise from '../hooks/usePromise'
import { DuplicateSectionInFileSectionRowsValidator, hasHeader, InvalidationType, SectionNameHeaderValidator, SectionRowsValidator, SectionsRowInvalidation, SectionsSchemaInvalidation, SectionsSchemaValidator } from '../components/BulkSectionCreateValidators'
import ExampleFileDownloadHeader, { ExampleFileDownloadHeaderProps } from '../components/ExampleFileDownloadHeader'
import { CanvasCourseSection } from '../models/canvas'
import { createSectionsProps } from '../models/feature'
import { CCMComponentProps } from '../models/FeatureUIData'
import { APIErrorPayload, IDefaultError } from '../models/models'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: 25,
    textAlign: 'left',
    '& button': {
      margin: 5
    }
  },
  confirmContainer: {
    position: 'relative',
    zIndex: 0,
    textAlign: 'center'
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
    paddingRight: 10,
    textAlign: 'left'
  },
  fileName: {
    color: '#3F648E',
    fontFamily: 'monospace'
  },
  popover: {
    pointerEvents: 'none'
  },
  paper: {
    padding: theme.spacing(1)
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
  errorIcon: {
    color: '#3F648E'
  },
  warningIcon: {
    color: '#e2cf2a'
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
    color: '#3F648E'
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
    color: '#3F648E'
  }
}))

const useSuccessStyles = makeStyles((theme) => ({
  card: {
    textAlign: 'center'
  },
  cardContent: {
  },
  cardFooter: {
    display: 'block',
    backgroundColor: '#F7F7F7',
    textAlign: 'center'
  },
  cardFooterText: {
    textAlign: 'center'
  },
  icon: {
    color: '#306430',
    width: 100,
    height: 100
  }
}))

enum BulkSectionCreatePageState {
  UploadPending,
  LoadingExistingSectionNamesFailed,
  InvalidUpload,
  Submit,
  CreateSectionsSuccess,
  CreateSectionsError,
  Saving
}

enum ErrorType {
  Error,
  Warning
}

interface BulkSectionCreatePageStateData {
  state: BulkSectionCreatePageState
  rowInvalidations: SectionsRowInvalidation[]
  schemaInvalidation: SectionsSchemaInvalidation[]
}

interface BulkSectionCreateProps extends CCMComponentProps {}

function BulkSectionCreate (props: BulkSectionCreateProps): JSX.Element {
  const classes = useStyles()
  const confirmationClasses = useConfirmationStyles()
  const rowLevelErrorClasses = useRowLevelErrorStyles()
  const topLevelClasses = useTopLevelErrorStyles()
  const apiErrorClasses = useAPIErrorStyles()
  const successClasses = useSuccessStyles()

  const [pageState, setPageState] = useState<BulkSectionCreatePageStateData>({ state: BulkSectionCreatePageState.UploadPending, schemaInvalidation: [], rowInvalidations: [] })
  const [file, setFile] = useState<File|undefined>(undefined)
  const [sectionNames, setSectionNames] = useState<string[]>([])
  const [existingSectionNames, setExistingSectionNames] = useState<string[]|undefined>(undefined)

  const [doLoadCanvasSectionData, isExistingSectionsLoading, getCanvasSectionDataError] = usePromise(
    async () => await getCourseSections(props.ltiKey, props.globals.course.id),
    (value: CanvasCourseSection[]) => {
      const es = value.map(s => { return s.name.toUpperCase() })
      setExistingSectionNames(es)
    }
  )
  useEffect(() => {
    setPageState({ state: BulkSectionCreatePageState.LoadingExistingSectionNamesFailed, schemaInvalidation: [], rowInvalidations: [] })
  }, [getCanvasSectionDataError])

  useEffect(() => {
    if (pageState.state === BulkSectionCreatePageState.Saving) {
      const serverInvalidations = doServerValidation()
      if (serverInvalidations.length !== 0) {
        handleRowLevelInvalidationError(serverInvalidations)
      } else {
        void doSaveCanvasSectionData()
      }
    }
  }, [existingSectionNames])

  const [doSaveCanvasSectionData, isSaveCanvasSectionDataLoading, getSaveCanvasSectionDataError] = usePromise(
    async () => await addCourseSections(props.ltiKey, props.globals.course.id, sectionNames),
    (newSections: CanvasCourseSection[]) => {
      const originalSectionNames: string[] = (existingSectionNames != null) ? existingSectionNames : []
      setPageState({ state: BulkSectionCreatePageState.CreateSectionsSuccess, schemaInvalidation: [], rowInvalidations: [] })
      setExistingSectionNames([...new Set([...originalSectionNames, ...newSections.map(newSection => { return newSection.name.toUpperCase() })])])
    }
  )

  const submit = async (): Promise<void> => {
    setPageState({ state: BulkSectionCreatePageState.Saving, schemaInvalidation: [], rowInvalidations: [] })
    void doLoadCanvasSectionData()
  }

  const convertErrorsToRowInvalidations = (apiError: APIErrorPayload[]): SectionsRowInvalidation[] => {
    const invalidations: SectionsRowInvalidation[] = []
    if (apiError !== undefined) {
      apiError.forEach(e => {
        invalidations.push({ message: '"' + (e.failedInput !== null ? e.failedInput : 'UNKNOWN') + '" ' + e.message, rowNumber: e.failedInput !== null ? sectionNames.indexOf(e.failedInput) + 1 : -1, type: InvalidationType.Error })
      })
    }
    return invalidations
  }

  useEffect(() => {
    if (getSaveCanvasSectionDataError !== undefined) {
      const errors = (getSaveCanvasSectionDataError as unknown as IDefaultError).errors
      const rowInvalidations = convertErrorsToRowInvalidations(errors)
      setPageState({ state: BulkSectionCreatePageState.CreateSectionsError, schemaInvalidation: [], rowInvalidations: rowInvalidations })
    }
  }, [getSaveCanvasSectionDataError])

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
          invalidations.push({ message: 'Section name already used in this course: "' + sectionName + '"', rowNumber: i + 1, type: InvalidationType.Error })
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
    if (file === undefined) {
      resetPageState()
    } else {
      parseFile(file)
    }
  }, [file])

  useEffect(() => {
    if (sectionNames.length > 0) {
      const clientInvalidations = doClientValidation()
      if (clientInvalidations.length !== 0) {
        handleRowLevelInvalidationError(clientInvalidations)
      } else {
        setPageState({ state: BulkSectionCreatePageState.Submit, schemaInvalidation: [], rowInvalidations: [] })
      }
    }
  }, [sectionNames])

  const resetPageState = (): void => {
    setPageState({ state: BulkSectionCreatePageState.UploadPending, schemaInvalidation: [], rowInvalidations: [] })
  }

  const handleSchemaError = (schemaInvalidations: SectionsSchemaInvalidation[]): void => {
    setPageState({ state: BulkSectionCreatePageState.InvalidUpload, schemaInvalidation: schemaInvalidations, rowInvalidations: [] })
  }

  const handleRowLevelInvalidationError = (invalidations: SectionsRowInvalidation[]): void => {
    setPageState({ state: BulkSectionCreatePageState.InvalidUpload, schemaInvalidation: [], rowInvalidations: invalidations })
  }

  const handleParseSuccess = (sectionNames: string[]): void => {
    setSectionNames(sectionNames)
    setPageState({ state: BulkSectionCreatePageState.Submit, schemaInvalidation: [], rowInvalidations: [] })
  }

  const parseFile = (file: File): void => {
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
      handleParseSuccess(lines)
    }).catch(e => {
      // TODO Not sure how to produce this error in real life
      handleSchemaError([{ error: 'Error processing file', type: InvalidationType.Error }])
    })
  }

  const doClientValidation = (): SectionsRowInvalidation[] => {
    const rowInvalidations: SectionsRowInvalidation[] = []

    const duplicateNamesInFileValidator: SectionRowsValidator = new DuplicateSectionInFileSectionRowsValidator()
    rowInvalidations.push(...duplicateNamesInFileValidator.validate(sectionNames))

    return rowInvalidations
  }

  const doServerValidation = (): SectionsRowInvalidation[] => {
    const rowInvalidations: SectionsRowInvalidation[] = []
    const duplicatesNamesInCanvasValidator: DuplicateExistingSectionRowsValidator = new DuplicateExistingSectionRowsValidator()
    rowInvalidations.push(...duplicatesNamesInCanvasValidator.validate(sectionNames))

    return rowInvalidations
  }

  const renderUploadHeader = (): JSX.Element => {
    const fileData =
`SECTION_NAME
Section 001`
    const fileDownloadHeaderProps: ExampleFileDownloadHeaderProps = {
      bodyText: 'Your file should include one section name per line',
      fileData: fileData,
      fileName: 'sections.csv',
      linkText: 'Download an example',
      titleText: 'Upload your CSV File'
    }
    return (<ExampleFileDownloadHeader {...fileDownloadHeaderProps} />)
  }

  const renderLoadingText = (): JSX.Element => {
    if (isExistingSectionsLoading) {
      return (<Typography>Loading Section Information</Typography>)
    } else {
      return (<Typography>Saving Section Information</Typography>)
    }
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
          {renderLoadingText()}
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
    // eslint-disable-next-line no-void
    return <Button color='primary' component="span" onClick={() => { resetPageState(); void doLoadCanvasSectionData() }}>Try again</Button>
  }

  const renderErrorIcon = (errorType: ErrorType): JSX.Element => {
    if (errorType === ErrorType.Error) {
      return (<ErrorIcon className={rowLevelErrorClasses.errorIcon} fontSize='large'/>)
    } else {
      return (<Warning className={rowLevelErrorClasses.warningIcon} fontSize='large'/>)
    }
  }

  const renderRowLevelErrors = (invalidations: SectionsRowInvalidation[], title: string, errorType: ErrorType): JSX.Element => {
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
                <Typography>{title}</Typography>
                {renderErrorIcon(errorType)}
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
              <Typography>Grading Scheme must be enabled in course settings.</Typography>
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
      rowLevelErrors = renderRowLevelErrors(pageState.rowInvalidations, 'Review your CSV file', ErrorType.Error)
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

  const renderPartialSuccess = (): JSX.Element => {
    let rowLevelErrors: JSX.Element | undefined
    if (pageState.rowInvalidations.length > 0) {
      rowLevelErrors = renderRowLevelErrors(pageState.rowInvalidations, 'Some errors occurred', ErrorType.Warning)
    }
    return (
      <div>
        {rowLevelErrors !== undefined && rowLevelErrors}
      </div>
    )
  }

  const renderAPIError = (): JSX.Element => {
    return (
      <Grid item xs={12} className={apiErrorClasses.dialog}>
        <Paper role='alert' >
          <ErrorIcon className={apiErrorClasses.dialogIcon} fontSize='large'/>
          <Typography>Something went wrong.  Please try again later.</Typography>
          {renderTryAgainButton()}
        </Paper>
      </Grid>
    )
  }

  const renderConfirm = (sectionNames: Section[]): JSX.Element => {
    return (
      <div className={classes.confirmContainer}>
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
                <Button variant="outlined" onClick={(e) => resetPageState()}>Cancel</Button>
                <Button variant="outlined" onClick={async () => await submit()}>Sumbit</Button>
              </Paper>
            </Grid>
          </Box>
        </Grid>
        <Backdrop className={classes.backdrop} open={isSaveCanvasSectionDataLoading}>
        <Grid container>
          <Grid item xs={12}>
            <CircularProgress color="inherit" />
          </Grid>
          <Grid item xs={12}>
          {renderLoadingText()}
          </Grid>
        </Grid>
      </Backdrop>
      </div>)
  }

  const sectionNamesToSection = (sectionNames: string[]): Section[] => {
    return sectionNames.map((name, i) => { return { rowNumber: i + 1, sectionName: name } })
  }

  const renderSuccess = (): JSX.Element => {
    return (
      <Card className={successClasses.card} variant="outlined">
        <CardContent className={successClasses.cardContent}>
          <CheckCircle className={successClasses.icon} fontSize='large'/>
          <Typography>New sections have been added!</Typography>
        </CardContent>
        <CardActions className={successClasses.cardFooter}>
          See your sections in the Canvas Setting
        </CardActions>
      </Card>
    )
  }
  const renderComponent = (): JSX.Element => {
    switch (pageState.state) {
      case BulkSectionCreatePageState.UploadPending:
        return renderUpload()
      case BulkSectionCreatePageState.LoadingExistingSectionNamesFailed:
        return renderAPIError()
      case BulkSectionCreatePageState.InvalidUpload:
        return renderInvalidUpload()
      case BulkSectionCreatePageState.Submit:
      case BulkSectionCreatePageState.Saving:
        return renderConfirm(sectionNamesToSection(sectionNames))
      case BulkSectionCreatePageState.CreateSectionsSuccess:
        return renderSuccess()
      case BulkSectionCreatePageState.CreateSectionsError:
        return renderPartialSuccess()
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
