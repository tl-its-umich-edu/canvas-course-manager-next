import {
  Backdrop, Box, Button, CircularProgress, Grid, Link, makeStyles, Paper, Typography
} from '@material-ui/core'
import { CloudDone as CloudDoneIcon } from '@material-ui/icons'
import React, { useEffect, useState } from 'react'

import { addCourseSections, getCourseSections } from '../api'
import ErrorAlert from '../components/ErrorAlert'
import BulkSectionCreateUploadConfirmationTable, { Section } from '../components/BulkSectionCreateUploadConfirmationTable'
import {
  DuplicateSectionInFileSectionRowsValidator, EmptySectionNameValidator, SectionNameTooLongValidator,
  SectionRowsValidator, SectionsRowInvalidation
} from '../components/BulkSectionCreateValidators'
import CanvasAPIErrorsTable from '../components/CanvasAPIErrorsTable'
import CSVFileName from '../components/CSVFileName'
import ExampleFileDownloadHeader, { ExampleFileDownloadHeaderProps } from '../components/ExampleFileDownloadHeader'
import FileUpload from '../components/FileUpload'
import RowLevelErrorsContent from '../components/RowLevelErrorsContent'
import SuccessCard from '../components/SuccessCard'
import ValidationErrorTable from '../components/ValidationErrorTable'
import usePromise from '../hooks/usePromise'
import { CanvasCourseSection } from '../models/canvas'
import { createSectionsProps } from '../models/feature'
import { CCMComponentProps } from '../models/FeatureUIData'
import { InvalidationType } from '../models/models'
import CSVSchemaValidator, { SchemaInvalidation } from '../utils/CSVSchemaValidator'
import { FileParserWrapper, UnknownCSVRecord } from '../utils/FileParserWrapper'
import { CanvasError } from '../utils/handleErrors'

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

interface SectionNameRecord extends UnknownCSVRecord {
  'SECTION_NAME': string
}

const isSectionNameRecord = (r: UnknownCSVRecord): r is SectionNameRecord => {
  return typeof r.SECTION_NAME === 'string'
}

enum BulkSectionCreatePageState {
  UploadPending,
  LoadingExistingSectionNamesFailed,
  InvalidUpload,
  Submit,
  CreateSectionsSuccess,
  CreateSectionsError,
  Saving
}

interface BulkSectionCreatePageStateData {
  state: BulkSectionCreatePageState
  rowInvalidations: SectionsRowInvalidation[]
  schemaInvalidations: SchemaInvalidation[]
}

function BulkSectionCreate (props: CCMComponentProps): JSX.Element {
  const classes = useStyles()
  const confirmationClasses = useConfirmationStyles()

  const [pageState, setPageState] = useState<BulkSectionCreatePageStateData>(
    { state: BulkSectionCreatePageState.UploadPending, schemaInvalidations: [], rowInvalidations: [] }
  )
  const [file, setFile] = useState<File|undefined>(undefined)
  const [sectionNames, setSectionNames] = useState<string[]>([])
  const [existingSectionNames, setExistingSectionNames] = useState<string[]|undefined>(undefined)

  const [doGetSections, isGetSectionsLoading, getSectionsError] = usePromise(
    async () => await getCourseSections(props.globals.course.id),
    (value: CanvasCourseSection[]) => {
      const existingSuggestions = value.map(s => { return s.name.toUpperCase() })
      setExistingSectionNames(existingSuggestions)
    }
  )

  const [doAddSections, isAddSectionsLoading, addSectionsError] = usePromise(
    async () => await addCourseSections(props.globals.course.id, sectionNames),
    (newSections: CanvasCourseSection[]) => {
      const originalSectionNames: string[] = (existingSectionNames != null) ? existingSectionNames : []
      setPageState({ state: BulkSectionCreatePageState.CreateSectionsSuccess, schemaInvalidations: [], rowInvalidations: [] })
      setExistingSectionNames([...new Set([...originalSectionNames, ...newSections.map(newSection => { return newSection.name.toUpperCase() })])])
    }
  )

  useEffect(() => {
    if (getSectionsError !== undefined) {
      setPageState({ state: BulkSectionCreatePageState.LoadingExistingSectionNamesFailed, schemaInvalidations: [], rowInvalidations: [] })
    }
  }, [getSectionsError])

  useEffect(() => {
    if (pageState.state === BulkSectionCreatePageState.Saving) {
      const serverInvalidations = doServerValidation()
      if (serverInvalidations.length !== 0) {
        handleRowLevelInvalidationError(serverInvalidations)
      } else {
        void doAddSections()
      }
    }
  }, [existingSectionNames])

  const isSubmitting = (): boolean => {
    return (isGetSectionsLoading || isAddSectionsLoading)
  }

  const submit = async (): Promise<void> => {
    setPageState({ state: BulkSectionCreatePageState.Saving, schemaInvalidations: [], rowInvalidations: [] })
    void doGetSections()
  }

  useEffect(() => {
    if (addSectionsError !== undefined) {
      setPageState({ state: BulkSectionCreatePageState.CreateSectionsError, schemaInvalidations: [], rowInvalidations: [] })
    }
  }, [addSectionsError])

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

  useEffect(() => {
    if (sectionNames.length > 0) {
      const clientInvalidations = doClientValidation()
      if (clientInvalidations.length !== 0) {
        handleRowLevelInvalidationError(clientInvalidations)
      } else {
        setPageState({ state: BulkSectionCreatePageState.Submit, schemaInvalidations: [], rowInvalidations: [] })
      }
    }
  }, [sectionNames])

  const resetPageState = (): void => {
    setPageState({ state: BulkSectionCreatePageState.UploadPending, schemaInvalidations: [], rowInvalidations: [] })
  }

  const handleSchemaError = (schemaInvalidations: SchemaInvalidation[]): void => {
    setPageState({ state: BulkSectionCreatePageState.InvalidUpload, schemaInvalidations: schemaInvalidations, rowInvalidations: [] })
  }

  const handleRowLevelInvalidationError = (invalidations: SectionsRowInvalidation[]): void => {
    setPageState({ state: BulkSectionCreatePageState.InvalidUpload, schemaInvalidations: [], rowInvalidations: invalidations })
  }

  const handleParseSuccess = (sectionNames: string[]): void => {
    setSectionNames(sectionNames)
    setPageState({ state: BulkSectionCreatePageState.Submit, schemaInvalidations: [], rowInvalidations: [] })
  }

  const handleParseComplete = (headers: string[] | undefined, data: UnknownCSVRecord[]): void => {
    const sectionNameValidator = new CSVSchemaValidator<SectionNameRecord>(['SECTION_NAME'], isSectionNameRecord, 60)

    let sectionNames: string[] | undefined
    const schemaInvalidations = sectionNameValidator.validate(headers, data)
    if (sectionNameValidator.checkRecordShapes(data)) {
      sectionNames = data.map(r => r.SECTION_NAME)
    } else {
      schemaInvalidations.push(CSVSchemaValidator.recordShapeInvalidation)
    }

    if (schemaInvalidations.length === 0 && sectionNames !== undefined) {
      return handleParseSuccess(sectionNames)
    } else {
      return handleSchemaError(schemaInvalidations)
    }
  }

  const parseFile = (file: File): void => {
    const parser = new FileParserWrapper()
    parser.parseCSV(
      file,
      handleParseComplete,
      (e) => handleSchemaError([{ error: e.message, type: InvalidationType.Error }])
    )
  }

  useEffect(() => {
    if (file !== undefined) {
      parseFile(file)
    }
  }, [file])

  const doClientValidation = (): SectionsRowInvalidation[] => {
    const rowInvalidations: SectionsRowInvalidation[] = []

    const duplicateNamesInFileValidator: SectionRowsValidator = new DuplicateSectionInFileSectionRowsValidator()
    rowInvalidations.push(...duplicateNamesInFileValidator.validate(sectionNames))
    const emptyNamesInFileValidator: EmptySectionNameValidator = new EmptySectionNameValidator()
    rowInvalidations.push(...emptyNamesInFileValidator.validate(sectionNames))
    const sectionNamesTooLongValidator: SectionNameTooLongValidator = new SectionNameTooLongValidator()
    rowInvalidations.push(...sectionNamesTooLongValidator.validate(sectionNames))

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

  const renderLoadingText = (): JSX.Element | undefined => {
    if (isGetSectionsLoading) {
      return (<Typography>Loading Section Information</Typography>)
    } else if (isAddSectionsLoading) {
      return (<Typography>Saving Section Information</Typography>)
    }
  }

  const renderFileUpload = (): JSX.Element => {
    return <div className={classes.uploadContainer}>
      <Grid container>
        <Grid item xs={12}>
          <FileUpload onUploadComplete={(file) => setFile(file)} />
        </Grid>
      </Grid>
      <Backdrop className={classes.backdrop} open={isGetSectionsLoading}>
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

  const renderTopLevelErrors = (errors: JSX.Element[]): JSX.Element => {
    return (
      <div>
        {file !== undefined && <CSVFileName file={file} />}
        <ErrorAlert messages={errors} tryAgain={resetPageState}/>
      </div>
    )
  }

  const renderInvalidUpload = (): JSX.Element => {
    let rowLevelErrors: JSX.Element | undefined
    let schemaLevelErrors: JSX.Element | undefined
    if (pageState.rowInvalidations.length > 0) {
      rowLevelErrors = (
        <>
        {file !== undefined && <CSVFileName file={file} />}
        <RowLevelErrorsContent
          table={<ValidationErrorTable invalidations={pageState.rowInvalidations} />}
          resetUpload={resetPageState}
          title='Review your CSV file'
          errorType='error'
        />
        </>
      )
    }
    if (pageState.schemaInvalidations.length > 0) {
      const schemaErrors: JSX.Element[] = pageState.schemaInvalidations.map((invalidation, i) => {
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

  const renderPartialSuccess = (error: Error): JSX.Element => {
    const apiErrorMessage = (
      <Typography key={0}>The last action failed with the following message: {error.message}</Typography>
    )
    return (
      error instanceof CanvasError
        ? (
            <>
            {file !== undefined && <CSVFileName file={file} />}
            <RowLevelErrorsContent
              table={<CanvasAPIErrorsTable errors={error.errors} />}
              title='Some errors occurred'
              errorType='error'
              resetUpload={resetPageState}
            />
            </>
          )
        : <ErrorAlert messages={[apiErrorMessage]} tryAgain={resetPageState} />
    )
  }

  const renderConfirm = (sectionNames: Section[]): JSX.Element => {
    return (
      <div className={classes.confirmContainer}>
        {file !== undefined && <CSVFileName file={file} />}
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
                <Typography>Your file is valid!  If this looks correct, click &quot;Submit&quot; to proceed.</Typography>
                <Button variant="outlined" onClick={(e) => resetPageState()}>Cancel</Button>
                <Button variant="outlined" disabled={isSubmitting()} onClick={submit}>Submit</Button>
              </Paper>
            </Grid>
          </Box>
        </Grid>
        <Backdrop className={classes.backdrop} open={isAddSectionsLoading}>
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
    return sectionNames.map((name, i) => ({ rowNumber: i + 1 + 1, sectionName: name })) // Add 1 for expected headers
  }

  const renderSuccess = (): JSX.Element => {
    const { canvasURL, course } = props.globals
    const settingsURL = `${canvasURL}/courses/${course.id}/settings`
    const message = <Typography>New sections have been added!</Typography>
    const nextAction = (
      <span>
        See your sections on the <Link href={settingsURL} target='_parent'>Canvas Settings page</Link> for your course.
      </span>
    )
    return <SuccessCard {...{ message, nextAction }} />
  }

  const renderComponent = (): JSX.Element | undefined => {
    switch (pageState.state) {
      case BulkSectionCreatePageState.UploadPending:
        return renderUpload()
      case BulkSectionCreatePageState.LoadingExistingSectionNamesFailed:
        return (
          <ErrorAlert
            messages={[<Typography key={0}>An error occurred while loading section data from Canvas.</Typography>]}
            tryAgain={resetPageState}
          />
        )
      case BulkSectionCreatePageState.InvalidUpload:
        return renderInvalidUpload()
      case BulkSectionCreatePageState.Submit:
      case BulkSectionCreatePageState.Saving:
        return renderConfirm(sectionNamesToSection(sectionNames))
      case BulkSectionCreatePageState.CreateSectionsSuccess:
        return renderSuccess()
      case BulkSectionCreatePageState.CreateSectionsError:
        if (addSectionsError !== undefined) {
          return renderPartialSuccess(addSectionsError)
        }
        return
      default:
        return <div>?</div>
    }
  }

  return (
    <div className={classes.root}>
      <Typography variant='h5' component='h1'>{createSectionsProps.title}</Typography>
      {renderComponent()}
    </div>
  )
}

export default BulkSectionCreate
