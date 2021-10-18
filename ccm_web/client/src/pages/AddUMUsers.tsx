import {
  Backdrop, Box, Button, CircularProgress, createStyles, Grid, Link, makeStyles,
  Paper, Step, StepLabel, Stepper, Theme, Tooltip, Typography
} from '@material-ui/core'
import React, { useEffect, useState } from 'react'
import { CloudDone as CloudDoneIcon, HelpOutline as HelpIcon } from '@material-ui/icons'

import { addSectionEnrollments, getCourseSections } from '../api'
import ErrorAlert from '../components/ErrorAlert'
import BulkEnrollUMUserConfirmationTable, { IAddUMUserEnrollment } from '../components/BulkEnrollUMUserConfirmationTable'
import CanvasAPIErrorsTable from '../components/CanvasAPIErrorsTable'
import CreateSectionWidget from '../components/CreateSectionWidget'
import CSVFileName from '../components/CSVFileName'
import ExampleFileDownloadHeader, { ExampleFileDownloadHeaderProps } from '../components/ExampleFileDownloadHeader'
import FileUpload from '../components/FileUpload'
import RowLevelErrorsContent from '../components/RowLevelErrorsContent'
import SectionSelectorWidget from '../components/SectionSelectorWidget'
import SuccessCard from '../components/SuccessCard'
import ValidationErrorTable, { RowValidationError } from '../components/ValidationErrorTable'
import usePromise from '../hooks/usePromise'
import { CanvasCourseSection, injectCourseName, CanvasCourseSectionWithCourseName, getCanvasRole, isValidRole } from '../models/canvas'
import { addUMUsersProps } from '../models/feature'
import { CCMComponentProps } from '../models/FeatureUIData'
import { InvalidationType } from '../models/models'
import { CanvasError } from '../utils/handleErrors'
import { FileParserWrapper, UnknownCSVRecord } from '../utils/FileParserWrapper'
import CSVSchemaValidator, { SchemaInvalidation } from '../utils/CSVSchemaValidator'

const USER_ROLE_TEXT = 'Role'
const USER_ID_TEXT = 'Login ID'
const MAX_ENROLLMENT_RECORDS = 400
const MAX_ENROLLMENT_MESSAGE = `The maximum number of user enrollments allowed is ${MAX_ENROLLMENT_RECORDS}.`

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      padding: 25,
      textAlign: 'left'
    },
    backButton: {
      marginRight: theme.spacing(1)
    },
    backdrop: {
      zIndex: theme.zIndex.drawer + 1,
      color: '#fff',
      position: 'absolute'
    },
    confirmContainer: {
      position: 'relative',
      zIndex: 0,
      textAlign: 'center'
    },
    instructions: {
      marginTop: theme.spacing(1),
      marginBottom: theme.spacing(1)
    },
    createSectionWidget: {
      width: '500px'
    },
    sectionSelectButton: {
      float: 'right'
    },
    sectionSelectionContainer: {
      position: 'relative',
      zIndex: 0,
      textAlign: 'center',
      maxHeight: '400px'
    },
    stepper: {
      textAlign: 'center',
      paddingTop: '20px'
    },
    uploadContainer: {
      position: 'relative',
      zIndex: 0,
      textAlign: 'center'
    },
    dialog: {
      textAlign: 'center',
      marginBottom: 15,
      paddingLeft: 10,
      paddingRight: 10
    },
    dialogButton: {
      margin: 5
    },
    table: {
      paddingLeft: 10,
      paddingRight: 10
    },
    dialogIcon: {
      color: '#3F648E'
    },
    newSectionHint: {
      display: 'flex'
    },
    createSectionContainer: {
      paddingBottom: '20px'
    }
  })
)

interface EnrollmentRecord extends UnknownCSVRecord {
  'LOGIN ID': string
  'ROLE': string
}

const isEnrollmentRecord = (record: UnknownCSVRecord): record is EnrollmentRecord => {
  return (
    typeof record['LOGIN ID'] === 'string' &&
    typeof record.ROLE === 'string'
  )
}

interface AddUMUsersProps extends CCMComponentProps {}

function AddUMUsers (props: AddUMUsersProps): JSX.Element {
  enum States {
    SelectSection = 0,
    UploadCSV = 1,
    ReviewCSV = 2,
    Confirmation = 3
  }

  const classes = useStyles()
  const [activeStep, setActiveStep] = useState(States.SelectSection)

  const [sections, setSections] = useState<CanvasCourseSectionWithCourseName[]>([])
  const [selectedSection, setSelectedSection] = useState<CanvasCourseSectionWithCourseName | undefined>(undefined)
  const [file, setFile] = useState<File|undefined>(undefined)
  const [enrollments, setEnrollments] = useState<IAddUMUserEnrollment[]|undefined>(undefined)
  const [schemaInvalidations, setSchemaInvalidations] = useState<SchemaInvalidation[] | undefined>(undefined)
  const [rowErrors, setRowErrors] = useState<RowValidationError[] | undefined>(undefined)

  const updateSections = (sections: CanvasCourseSectionWithCourseName[]): void => {
    setSections(sections.sort((a, b) => { return a.name.localeCompare(b.name, undefined, { numeric: true }) }))
  }

  const [doGetSections, isGetSectionsLoading, getSectionsError, clearGetSectionsError] = usePromise(
    async () => await getCourseSections(props.globals.course.id),
    (sections: CanvasCourseSection[]) => {
      updateSections(injectCourseName(sections, props.course.name))
    }
  )

  const [doAddEnrollments, isAddEnrollmentsLoading, addEnrollmentsError, clearAddEnrollmentsError] = usePromise(
    async (section: CanvasCourseSectionWithCourseName, enrollments: IAddUMUserEnrollment[]) => {
      const apiEnrollments = enrollments.map(e => ({ loginId: e.loginId, type: getCanvasRole(e.role) }))
      await addSectionEnrollments(section.id, apiEnrollments)
    },
    () => { setActiveStep(States.Confirmation) }
  )

  useEffect(() => {
    if (getSectionsError === undefined) {
      void doGetSections()
    }
  }, [getSectionsError])

  useEffect(() => {
    if (file !== undefined) {
      parseFile(file)
    }
  }, [file])

  const getSteps = (): string[] => {
    return ['Select', 'Upload', 'Review', 'Confirmation']
  }
  const steps = getSteps()

  const sectionCreated = (newSection: CanvasCourseSection): void => {
    const newSectionWithCourseName = injectCourseName([newSection], props.course.name)[0]
    updateSections(sections.concat(newSectionWithCourseName))
    setSelectedSection(newSectionWithCourseName)
  }

  const isValidLoginId = (loginId: string): boolean => {
    if (loginId.trim().length === 0) return false
    return true
  }

  const handleParseSuccess = (enrollments: IAddUMUserEnrollment[]): void => {
    setEnrollments(enrollments)
    setRowErrors(undefined)
    setActiveStep(States.ReviewCSV)
  }

  const handleParseFailure = (errors: RowValidationError[]): void => {
    setEnrollments(undefined)
    setRowErrors(errors)
    setActiveStep(States.ReviewCSV)
  }

  const handleSchemaInvalidations = (invalidations: SchemaInvalidation[]): void => {
    setSchemaInvalidations(invalidations)
    setActiveStep(States.ReviewCSV)
  }

  const handleEnrollmentsReset = (): void => {
    clearAddEnrollmentsError()
    setEnrollments(undefined)
    setFile(undefined)
    setSchemaInvalidations(undefined)
    setRowErrors(undefined)
  }

  const handleUploadReset = (): void => {
    handleEnrollmentsReset()
    setActiveStep(States.UploadCSV)
  }

  const handleParseComplete = (headers: string[] | undefined, data: UnknownCSVRecord[]): void => {
    const csvValidator = new CSVSchemaValidator<EnrollmentRecord>(['LOGIN ID', 'ROLE'], isEnrollmentRecord, 400)

    const schemaInvalidations = csvValidator.validate(headers, data)

    let enrollmentRecords: EnrollmentRecord[] | undefined
    if (csvValidator.checkRecordShapes(data)) {
      enrollmentRecords = data.map(r => ({ 'LOGIN ID': r['LOGIN ID'], ROLE: r.ROLE }))
    } else {
      schemaInvalidations.push(CSVSchemaValidator.recordShapeInvalidation)
    }

    if (schemaInvalidations.length > 0 || enrollmentRecords === undefined) {
      return handleSchemaInvalidations(schemaInvalidations)
    }

    const enrollments: IAddUMUserEnrollment[] = []
    const errors: RowValidationError[] = []
    enrollmentRecords.forEach((r, i) => {
      const role = r.ROLE
      const loginId = r['LOGIN ID']
      if (!isValidRole(role)) {
        errors.push({ rowNumber: i + 2, message: `Invalid ${USER_ROLE_TEXT.toUpperCase()} '${role}'` })
      } else if (!isValidLoginId(loginId)) {
        errors.push({ rowNumber: i + 2, message: `Invalid ${USER_ID_TEXT.toUpperCase()} '${loginId}'` })
      } else {
        enrollments.push({ rowNumber: i + 2, loginId, role })
      }
    })

    if (errors.length === 0) {
      handleParseSuccess(enrollments)
    } else {
      handleParseFailure(errors)
    }
  }

  const parseFile = (file: File): void => {
    const parser = new FileParserWrapper()
    parser.parseCSV(
      file,
      handleParseComplete,
      (e) => handleSchemaInvalidations([{ error: e.message, type: InvalidationType.Error }])
    )
  }

  const getSelectContent = (): JSX.Element => {
    if (getSectionsError !== undefined) {
      return (
        <ErrorAlert
          messages={[<Typography key={0}>An error occurred while loading section data from Canvas.</Typography>]}
          tryAgain={clearGetSectionsError}
        />
      )
    } else {
      return (
        <>
          <div className={classes.createSectionContainer}>
            <div className={classes.newSectionHint}>
              <Typography>Create a new section to add users</Typography>
              <Tooltip placement='top' title='Enter a distinct name for this section'>
                <HelpIcon fontSize='small'/>
              </Tooltip>
            </div>
            <div className={classes.createSectionWidget}><CreateSectionWidget {...props} onSectionCreated={sectionCreated}/></div>
          </div>
          <Typography variant='subtitle1'>Or select an existing section to add users to</Typography>
          <div className={classes.sectionSelectionContainer}>
            <SectionSelectorWidget
              height={400}
              search={[]}
              multiSelect={false}
              sections={sections !== undefined ? sections : []}
              selectedSections={selectedSection !== undefined ? [selectedSection] : []}
              selectionUpdated={(sections) => setSelectedSection(sections[0])}
              canUnmerge={false}
            />
            <div>
              <Button
                className={classes.sectionSelectButton}
                variant='contained'
                color='primary'
                disabled={selectedSection === undefined}
                onClick={() => { setActiveStep(States.UploadCSV) }}
              >
                Select
              </Button>
            </div>
            <Backdrop className={classes.backdrop} open={isGetSectionsLoading}>
              <Grid container>
                <Grid item xs={12}>
                  <CircularProgress color='inherit' />
                </Grid>
                <Grid item xs={12}>
                  Loading sections
                </Grid>
              </Grid>
            </Backdrop>
          </div>
        </>
      )
    }
  }

  const renderUploadHeader = (): JSX.Element => {
    const fileData =
`${USER_ROLE_TEXT.toUpperCase()},${USER_ID_TEXT.toUpperCase()}
student,studenta
teacher,usera
ta,userb
observer,userc
designer,userd`
    const fileDownloadHeaderProps: ExampleFileDownloadHeaderProps = {
      bodyText: (
        `Your file should include a ${USER_ID_TEXT.toLocaleLowerCase()} ` +
        `and a ${USER_ROLE_TEXT.toLocaleLowerCase()} for each user. ` +
        MAX_ENROLLMENT_MESSAGE
      ),
      fileData: fileData,
      fileName: 'bulk_um_enroll.csv',
      linkText: 'Download an example',
      titleText: 'Upload your CSV File'
    }
    return (<ExampleFileDownloadHeader {...fileDownloadHeaderProps} />)
  }

  const uploadComplete = (file: File): void => {
    setFile(file)
  }

  const renderFileUpload = (): JSX.Element => {
    return <div className={classes.uploadContainer}>
      <Grid container>
        <Grid item xs={12}>
          <FileUpload onUploadComplete={uploadComplete}></FileUpload>
        </Grid>
      </Grid>
    </div>
  }

  const getUploadContent = (): JSX.Element => {
    return (
    <div>
      {renderUploadHeader()}
      <br/>
      {renderFileUpload()}
    </div>
    )
  }

  const renderConfirm = (section: CanvasCourseSectionWithCourseName, enrollments: IAddUMUserEnrollment[]): JSX.Element => {
    return (
      <div className={classes.confirmContainer}>
        {file !== undefined && <CSVFileName file={file} />}
        <Grid container>
          <Box clone order={{ xs: 2, sm: 1 }}>
            <Grid item xs={12} sm={9} className={classes.table}>
              <BulkEnrollUMUserConfirmationTable enrollments={enrollments} />
            </Grid>
          </Box>
          <Box clone order={{ xs: 1, sm: 2 }}>
            <Grid item xs={12} sm={3} className={classes.dialog}>
              <Paper role='status'>
                <Typography>Review your CSV file</Typography>
                <CloudDoneIcon className={classes.dialogIcon} fontSize='large'/>
                <Typography>Your file is valid!  If this looks correct, click &quot;Submit&quot; to proceed.</Typography>
                <Button className={classes.dialogButton} variant='outlined' onClick={handleUploadReset}>Cancel</Button>
                <Button
                  className={classes.dialogButton}
                  variant='outlined'
                  onClick={async () => await doAddEnrollments(section, enrollments)}
                >
                  Submit
                </Button>
              </Paper>
            </Grid>
          </Box>
        </Grid>
        <Backdrop className={classes.backdrop} open={isAddEnrollmentsLoading}>
        <Grid container>
          <Grid item xs={12}>
            <CircularProgress color="inherit" />
          </Grid>
          <Grid item xs={12}>
            Loading...
          </Grid>
          <Grid item xs={12}>
            Please stay on the page. This may take up to a couple of minutes for larger files.
          </Grid>
        </Grid>
      </Backdrop>
      </div>
    )
  }

  const renderRowValidationErrors = (errors: RowValidationError[]): JSX.Element => {
    return (
      <>
      {file !== undefined && <CSVFileName file={file} />}
      <RowLevelErrorsContent
        table={<ValidationErrorTable invalidations={errors} />}
        title='Review your CSV file'
        errorType='error'
        resetUpload={handleUploadReset}
      />
      </>
    )
  }

  const renderSchemaInvalidations = (invalidations: SchemaInvalidation[]): JSX.Element => {
    const errors = invalidations.map(
      (invalidation, i) => <Typography key={i} component='span'>{invalidation.error}</Typography>
    )
    return (
      <>
      {file !== undefined && <CSVFileName file={file} />}
      <ErrorAlert messages={errors} tryAgain={handleUploadReset} />
      </>
    )
  }

  const renderPostError = (error: Error): JSX.Element => {
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
              resetUpload={handleUploadReset}
            />
            </>
          )
        : <ErrorAlert messages={[apiErrorMessage]} tryAgain={handleUploadReset} />
    )
  }

  const getReviewContent = (): JSX.Element => {
    if (rowErrors !== undefined) {
      return renderRowValidationErrors(rowErrors)
    } else if (schemaInvalidations !== undefined) {
      return renderSchemaInvalidations(schemaInvalidations)
    } else if (addEnrollmentsError !== undefined) {
      return renderPostError(addEnrollmentsError)
    } else if (selectedSection !== undefined && enrollments !== undefined) {
      return renderConfirm(selectedSection, enrollments)
    } else {
      return (<div>?</div>)
    }
  }

  const getSuccessContent = (): JSX.Element => {
    const { canvasURL, course } = props.globals
    const settingsLink = (
      <Link href={`${canvasURL}/courses/${course.id}/settings`} target='_parent'>
        Canvas Settings page
      </Link>
    )
    const message = <Typography>New users have been added to the section!</Typography>
    const nextAction = (
      <span>
        See the users in the course&apos;s sections on the {settingsLink} for your course.
      </span>
    )
    return <SuccessCard {...{ message, nextAction }} />
  }

  const getShouldNotHappenContent = (): JSX.Element => {
    return (<div>Unexpected step</div>)
  }

  const getStepContent = (stepIndex: number): JSX.Element => {
    switch (stepIndex) {
      case States.SelectSection:
        return getSelectContent()
      case States.UploadCSV:
        return getUploadContent()
      case States.ReviewCSV:
        return getReviewContent()
      case States.Confirmation:
        return getSuccessContent()
      default:
        return getShouldNotHappenContent()
    }
  }

  return (
    <div className={classes.root}>
      <Typography variant='h5' component='h1'>{addUMUsersProps.title}</Typography>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>
      <div>{getStepContent(activeStep)}</div>
    </div>
  )
}

export default AddUMUsers
