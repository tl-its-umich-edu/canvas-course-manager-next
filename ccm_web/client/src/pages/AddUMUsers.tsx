import {
  Backdrop, Box, Button, CircularProgress, createStyles, Grid, Link, makeStyles, Typography
} from '@material-ui/core'
import React, { useEffect, useState } from 'react'

import { addSectionEnrollments, getCourseSections } from '../api'
import BulkApiErrorContent from '../components/BulkApiErrorContent'
import ErrorAlert from '../components/ErrorAlert'
import BulkEnrollUMUserConfirmationTable, { IAddUMUserEnrollment } from '../components/BulkEnrollUMUserConfirmationTable'
import ConfirmDialog from '../components/ConfirmDialog'
import CreateSelectSectionWidget from '../components/CreateSelectSectionWidget'
import CSVFileName from '../components/CSVFileName'
import ExampleFileDownloadHeader, { ExampleFileDownloadHeaderProps } from '../components/ExampleFileDownloadHeader'
import FileUpload from '../components/FileUpload'
import Help from '../components/Help'
import MethodSelect from '../components/MethodSelect'
import RowLevelErrorsContent from '../components/RowLevelErrorsContent'
import SuccessCard from '../components/SuccessCard'
import ValidationErrorTable, { RowValidationError } from '../components/ValidationErrorTable'
import WorkflowStepper from '../components/WorkflowStepper'
import usePromise from '../hooks/usePromise'
import {
  CanvasCourseSection, CanvasCourseSectionWithCourseName, ClientEnrollmentType, getCanvasRole, injectCourseName,
  sortSections
} from '../models/canvas'
import { CCMComponentProps } from '../models/FeatureUIData'
import { CSVWorkflowStep, InvalidationType } from '../models/models'
import CSVSchemaValidator, { SchemaInvalidation } from '../utils/CSVSchemaValidator'
import { EnrollmentInvalidation, LoginIDRowsValidator, RoleRowsValidator } from '../utils/enrollmentValidators'
import FileParserWrapper, { CSVRecord } from '../utils/FileParserWrapper'
import { getRowNumber } from '../utils/fileUtils'

const USER_ROLE_TEXT = 'Role'
const USER_ID_TEXT = 'Login ID'
const MAX_ENROLLMENT_RECORDS = 400
const MAX_ENROLLMENT_MESSAGE = `The maximum number of user enrollments allowed is ${MAX_ENROLLMENT_RECORDS}.`

const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      padding: 25,
      textAlign: 'left'
    },
    spacing: {
      marginBottom: theme.spacing(2)
    },
    buttonGroup: {
      marginTop: theme.spacing(1)
    },
    backdrop: {
      zIndex: theme.zIndex.drawer + 1,
      color: '#fff',
      position: 'absolute',
      textAlign: 'center'
    },
    instructions: {
      marginTop: theme.spacing(1),
      marginBottom: theme.spacing(1)
    },
    container: {
      position: 'relative',
      zIndex: 0
    },
    table: {
      paddingLeft: 10,
      paddingRight: 10
    }
  })
)

enum PageState {
  SelectInputMethod,
  CSVWorkflow
}

enum InputMethod {
  CSVSingleSection = 'single',
  CSVMultipleSections = 'multiple'
}

interface EnrollmentRecord extends CSVRecord {
  LOGIN_ID: string
  ROLE: string
}

const isEnrollmentRecord = (record: CSVRecord): record is EnrollmentRecord => {
  return (
    typeof record.LOGIN_ID === 'string' &&
    typeof record.ROLE === 'string'
  )
}

interface AddUMUsersProps extends CCMComponentProps {}

function AddUMUsers (props: AddUMUsersProps): JSX.Element {
  const classes = useStyles()
  const [pageState, setPageState] = useState<PageState>(PageState.SelectInputMethod)
  const [inputMethod, setInputMethod] = useState<InputMethod>(InputMethod.CSVSingleSection)
  const [activeStep, setActiveStep] = useState(CSVWorkflowStep.Select)

  const [sections, setSections] = useState<CanvasCourseSectionWithCourseName[] | undefined>(undefined)
  const [selectedSection, setSelectedSection] = useState<CanvasCourseSectionWithCourseName | undefined>(undefined)
  const [file, setFile] = useState<File|undefined>(undefined)
  const [enrollments, setEnrollments] = useState<IAddUMUserEnrollment[]|undefined>(undefined)
  const [schemaInvalidations, setSchemaInvalidations] = useState<SchemaInvalidation[] | undefined>(undefined)
  const [rowErrors, setRowErrors] = useState<RowValidationError[] | undefined>(undefined)

  const updateSections = (sections: CanvasCourseSectionWithCourseName[]): void => {
    setSections(sortSections(sections))
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
    () => { setActiveStep(CSVWorkflowStep.Confirmation) }
  )

  useEffect(() => {
    void doGetSections()
  }, [])

  useEffect(() => {
    if (file !== undefined) {
      parseFile(file)
    }
  }, [file])

  const sectionCreated = (newSection: CanvasCourseSection): void => {
    const newSectionWithCourseName = injectCourseName([newSection], props.course.name)[0]
    const existingSections = sections ?? []
    updateSections(existingSections.concat(newSectionWithCourseName))
    setSelectedSection(newSectionWithCourseName)
  }

  const handleParseSuccess = (enrollments: IAddUMUserEnrollment[]): void => {
    setEnrollments(enrollments)
    setRowErrors(undefined)
    setActiveStep(CSVWorkflowStep.Review)
  }

  const handleParseFailure = (errors: RowValidationError[]): void => {
    setEnrollments(undefined)
    setRowErrors(errors)
    setActiveStep(CSVWorkflowStep.Review)
  }

  const handleSchemaInvalidations = (invalidations: SchemaInvalidation[]): void => {
    setSchemaInvalidations(invalidations)
    setActiveStep(CSVWorkflowStep.Review)
  }

  const handleSectionsReset = (): void => {
    setSections(undefined)
    setSelectedSection(undefined)
    clearGetSectionsError()
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
    setActiveStep(CSVWorkflowStep.Upload)
  }

  const handleFullReset = async (): Promise<void> => {
    handleSectionsReset()
    handleEnrollmentsReset()
    setActiveStep(CSVWorkflowStep.Select)
    await doGetSections()
  }

  const handleParseComplete = (headers: string[] | undefined, data: CSVRecord[]): void => {
    const csvValidator = new CSVSchemaValidator<EnrollmentRecord>(
      ['LOGIN_ID', 'ROLE'], isEnrollmentRecord, MAX_ENROLLMENT_RECORDS
    )
    const validationResult = csvValidator.validate(headers, data)
    if (!validationResult.valid) return handleSchemaInvalidations(validationResult.schemaInvalidations)
    const enrollmentRecords = validationResult.validData.map((r) => ({ role: r.ROLE, loginId: r.LOGIN_ID }))

    const errors: EnrollmentInvalidation[] = []
    const rolesValidator = new RoleRowsValidator()
    errors.push(...rolesValidator.validate(enrollmentRecords.map(r => r.role)))

    const loginIDsValidator = new LoginIDRowsValidator()
    errors.push(...loginIDsValidator.validate(enrollmentRecords.map(r => r.loginId)))

    if (errors.length === 0) {
      const enrollments: IAddUMUserEnrollment[] = enrollmentRecords.map((r, i) => ({
        rowNumber: getRowNumber(i),
        loginId: r.loginId,
        role: r.role as ClientEnrollmentType
      }))
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
      (message) => handleSchemaInvalidations([{ message, type: InvalidationType.Error }])
    )
  }

  const getSelectInput = (): JSX.Element => {
    if (getSectionsError !== undefined) {
      return (
        <ErrorAlert
          messages={[<Typography key={0}>An error occurred while loading section data from Canvas.</Typography>]}
          tryAgain={async () => {
            handleSectionsReset()
            await doGetSections()
          }}
        />
      )
    }

    return (
      <div className={classes.container}>
        <MethodSelect<InputMethod>
          label='Add U-M users through a CSV'
          options={[
            { key: InputMethod.CSVSingleSection, label: 'One section at a time' },
            { key: InputMethod.CSVMultipleSections, label: 'Using multiple sections' }
          ]}
          typeGuard={(v): v is InputMethod => {
            return v === InputMethod.CSVSingleSection || v === InputMethod.CSVMultipleSections
          }}
          selectedMethod={inputMethod}
          setMethod={setInputMethod}
          disabled={isGetSectionsLoading}
          onButtonClick={() => setPageState(PageState.CSVWorkflow)}
        />
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
    )
  }

  const getSelectContent = (): JSX.Element => {
    return (
      <>
      <CreateSelectSectionWidget
        sections={sections ?? []}
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
        // Only admins have access to the Add UM Users feature, and they can create sections.
        canCreate={true}
        course={props.course}
        onSectionCreated={sectionCreated}
      />
      <Grid container className={classes.buttonGroup} justifyContent='flex-end'>
        <Button
          variant='contained'
          color='primary'
          disabled={selectedSection === undefined}
          onClick={() => setActiveStep(CSVWorkflowStep.Upload)}
        >
          Select
        </Button>
      </Grid>
      </>
    )
  }

  const renderUploadHeader = (): JSX.Element => {
    const fileData =
`${USER_ROLE_TEXT.toUpperCase()},${USER_ID_TEXT.replace(' ', '_').toUpperCase()}
student,studenta
teacher,usera
ta,userb
observer,userc
designer,userd`
    const fileDownloadHeaderProps: ExampleFileDownloadHeaderProps = {
      body: (
        <Typography>
          Your file should include a {USER_ID_TEXT.toLocaleLowerCase()} (uniqname) and
          a {USER_ROLE_TEXT.toLocaleLowerCase()} for each user. {MAX_ENROLLMENT_MESSAGE}
        </Typography>
      ),
      fileData,
      fileName: 'bulk_um_enroll.csv'
    }
    return <ExampleFileDownloadHeader {...fileDownloadHeaderProps} />
  }

  const uploadComplete = (file: File): void => {
    setFile(file)
  }

  const renderFileUpload = (): JSX.Element => {
    return <FileUpload onUploadComplete={uploadComplete} />
  }

  const getUploadContent = (): JSX.Element => {
    return (
      <div>
        {renderUploadHeader()}
        {renderFileUpload()}
        <Grid container className={classes.buttonGroup} justifyContent='flex-start'>
          <Button
            variant='outlined'
            aria-label='Back to Select Section'
            onClick={async () => {
              handleSectionsReset()
              setActiveStep(CSVWorkflowStep.Select)
              await doGetSections()
            }}
          >
            Back
          </Button>
        </Grid>
      </div>
    )
  }

  const renderConfirm = (section: CanvasCourseSectionWithCourseName, enrollments: IAddUMUserEnrollment[]): JSX.Element => {
    return (
      <div className={classes.container}>
        {file !== undefined && <CSVFileName file={file} />}
        <Grid container>
          <Box clone order={{ xs: 2, sm: 1 }}>
            <Grid item xs={12} sm={9} className={classes.table}>
              <BulkEnrollUMUserConfirmationTable enrollments={enrollments} />
            </Grid>
          </Box>
          <Box clone order={{ xs: 1, sm: 2 }}>
            <Grid item xs={12} sm={3}>
              <ConfirmDialog
                submit={async () => await doAddEnrollments(section, enrollments)}
                cancel={handleUploadReset}
                disabled={isAddEnrollmentsLoading}
              />
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
        resetUpload={handleUploadReset}
      />
      </>
    )
  }

  const renderSchemaInvalidations = (invalidations: SchemaInvalidation[]): JSX.Element => {
    const errors = invalidations.map(
      (invalidation, i) => <Typography key={i}>{invalidation.message}</Typography>
    )
    return (
      <>
      {file !== undefined && <CSVFileName file={file} />}
      <ErrorAlert messages={errors} tryAgain={handleUploadReset} />
      </>
    )
  }

  const getReviewContent = (): JSX.Element => {
    if (rowErrors !== undefined) {
      return renderRowValidationErrors(rowErrors)
    } else if (schemaInvalidations !== undefined) {
      return renderSchemaInvalidations(schemaInvalidations)
    } else if (addEnrollmentsError !== undefined) {
      return <BulkApiErrorContent error={addEnrollmentsError} file={file} tryAgain={handleUploadReset} />
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
    return (
      <>
      <SuccessCard {...{ message, nextAction }} />
      <Grid container className={classes.buttonGroup} justifyContent='flex-start'>
        <Button variant='outlined' aria-label={`Start ${props.title} again`} onClick={handleFullReset}>
          Start Again
        </Button>
      </Grid>
      </>
    )
  }

  const getShouldNotHappenContent = (): JSX.Element => {
    return (<div>Unexpected step</div>)
  }

  const getStepContent = (step: CSVWorkflowStep): JSX.Element => {
    switch (step) {
      case CSVWorkflowStep.Select:
        return getSelectContent()
      case CSVWorkflowStep.Upload:
        return getUploadContent()
      case CSVWorkflowStep.Review:
        return getReviewContent()
      case CSVWorkflowStep.Confirmation:
        return getSuccessContent()
      default:
        return getShouldNotHappenContent()
    }
  }

  return (
    <div className={classes.root}>
      <Help baseHelpURL={props.globals.baseHelpURL} helpURLEnding={props.helpURLEnding} />
      <Typography variant='h5' component='h1' className={classes.spacing}>{props.title}</Typography>
      <div>
        {
          pageState === PageState.SelectInputMethod
            ? getSelectInput()
            : inputMethod === InputMethod.CSVSingleSection
              ? (
                  <>
                  <WorkflowStepper allSteps={Object(CSVWorkflowStep)} activeStep={activeStep} />
                  {getStepContent(activeStep)}
                  </>
                )
              : <Typography>Multiple sections flow will start here.</Typography>
        }
      </div>
    </div>
  )
}

export default AddUMUsers
