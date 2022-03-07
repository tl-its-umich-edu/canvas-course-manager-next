import React, { useState } from 'react'
import { Backdrop, Box, Button, CircularProgress, Grid, Link, makeStyles, Typography } from '@material-ui/core'

import APIErrorMessage from './APIErrorMessage'
import BulkApiErrorContent from './BulkApiErrorContent'
import BulkEnrollUMUserConfirmationTable from './BulkEnrollUMUserConfirmationTable'
import ConfirmDialog from './ConfirmDialog'
import CreateSelectSectionWidget from './CreateSelectSectionWidget'
import CSVFileName from './CSVFileName'
import ErrorAlert from './ErrorAlert'
import ExampleFileDownloadHeader, { ExampleFileDownloadHeaderProps } from './ExampleFileDownloadHeader'
import FileUpload from './FileUpload'
import RowLevelErrorsContent from './RowLevelErrorsContent'
import SuccessCard from './SuccessCard'
import ValidationErrorTable, { RowValidationError } from './ValidationErrorTable'
import WorkflowStepper from './WorkflowStepper'
import * as api from '../api'
import usePromise from '../hooks/usePromise'
import {
  CanvasCourseBase, CanvasCourseSection, CanvasCourseSectionWithCourseName, ClientEnrollmentType,
  getCanvasRole, injectCourseName
} from '../models/canvas'
import {
  EnrollmentRecord, isEnrollmentRecord, MAX_ENROLLMENT_MESSAGE, MAX_ENROLLMENT_RECORDS,
  REQUIRED_ENROLLMENT_HEADERS, RowNumberedAddEnrollment, USER_ID_TEXT, USER_ROLE_TEXT
} from '../models/enrollment'
import { AddUMUsersLeafProps } from '../models/FeatureUIData'
import { CSVWorkflowStep, InvalidationType } from '../models/models'
import CSVSchemaValidator, { SchemaInvalidation } from '../utils/CSVSchemaValidator'
import { EnrollmentInvalidation, LoginIDRowsValidator, RoleRowsValidator } from '../utils/enrollmentValidators'
import FileParserWrapper, { CSVRecord } from '../utils/FileParserWrapper'
import { getRowNumber } from '../utils/fileUtils'

const useStyles = makeStyles(theme => ({
  spacing: {
    marginBottom: theme.spacing(2)
  },
  buttonGroup: {
    marginTop: theme.spacing(1)
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#FFF',
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
}))

interface SingleSectionEnrollmentWorkflowProps extends AddUMUsersLeafProps {
  course: CanvasCourseBase
  onSectionCreated: (newSection: CanvasCourseSection) => void
}

export default function SingleSectionEnrollmentWorkflow (props: SingleSectionEnrollmentWorkflowProps): JSX.Element {
  const classes = useStyles()

  const [activeStep, setActiveStep] = useState(CSVWorkflowStep.Select)
  const [selectedSection, setSelectedSection] = useState<CanvasCourseSectionWithCourseName | undefined>(undefined)
  const [file, setFile] = useState<File | undefined>(undefined)
  const [enrollments, setEnrollments] = useState<RowNumberedAddEnrollment[] | undefined>(undefined)
  const [schemaInvalidations, setSchemaInvalidations] = useState<SchemaInvalidation[] | undefined>(undefined)
  const [rowInvalidations, setRowInvalidations] = useState<RowValidationError[] | undefined>(undefined)

  const [doAddEnrollments, isAddEnrollmentsLoading, addEnrollmentsError, clearAddEnrollmentsError] = usePromise(
    async (section: CanvasCourseSectionWithCourseName, enrollments: RowNumberedAddEnrollment[]) => {
      const apiEnrollments = enrollments.map(e => ({ loginId: e.loginId, type: getCanvasRole(e.role) }))
      await api.addSectionEnrollments(section.id, apiEnrollments)
    },
    () => { setActiveStep(CSVWorkflowStep.Confirmation) }
  )

  const handleEnrollmentsReset = (): void => {
    setEnrollments(undefined)
    setFile(undefined)
    setSchemaInvalidations(undefined)
    setRowInvalidations(undefined)
  }

  const handleUploadReset = (): void => {
    handleEnrollmentsReset()
    clearAddEnrollmentsError()
    setActiveStep(CSVWorkflowStep.Upload)
  }

  const handleValidation = (headers: string[] | undefined, data: CSVRecord[]): void => {
    const csvValidator = new CSVSchemaValidator<EnrollmentRecord>(
      REQUIRED_ENROLLMENT_HEADERS, isEnrollmentRecord, MAX_ENROLLMENT_RECORDS
    )
    const validationResult = csvValidator.validate(headers, data)
    if (!validationResult.valid) return setSchemaInvalidations(validationResult.schemaInvalidations)

    const enrollmentRecords = validationResult.validData
    const errors: EnrollmentInvalidation[] = []

    const rolesValidator = new RoleRowsValidator()
    errors.push(...rolesValidator.validate(enrollmentRecords.map(r => r.ROLE)))

    const loginIDsValidator = new LoginIDRowsValidator()
    errors.push(...loginIDsValidator.validate(enrollmentRecords.map(r => r.LOGIN_ID)))

    if (errors.length > 0) return setRowInvalidations(errors)

    const enrollments: RowNumberedAddEnrollment[] = enrollmentRecords.map((r, i) => ({
      rowNumber: getRowNumber(i),
      loginId: r.LOGIN_ID,
      role: r.ROLE as ClientEnrollmentType
    }))
    setEnrollments(enrollments)
    setActiveStep(CSVWorkflowStep.Review)
  }

  const handleFile = (file: File): void => {
    setFile(file)
    const parser = new FileParserWrapper()
    parser.parseCSV(
      file,
      handleValidation,
      (message) => setSchemaInvalidations([{ message, type: InvalidationType.Error }])
    )
  }

  const getSelectContent = (): JSX.Element => {
    if (props.getSectionsError !== undefined) {
      return (
        <ErrorAlert
          messages={[<APIErrorMessage key={0} context='loading section data' error={props.getSectionsError} />]}
          tryAgain={async () => {
            setSelectedSection(undefined)
            await props.doGetSections()
          }}
        />
      )
    }

    return (
      <>
      <div className={classes.container}>
        <CreateSelectSectionWidget
          sections={props.sections}
          selectedSection={selectedSection}
          setSelectedSection={setSelectedSection}
          // Only admins have access to the Add UM Users feature, and they can create sections.
          canCreate={true}
          course={props.course}
          onSectionCreated={(s) => {
            setSelectedSection(injectCourseName([s], props.course.name)[0])
            props.onSectionCreated(s)
          }}
        />
        <Backdrop className={classes.backdrop} open={props.isGetSectionsLoading}>
          <Grid container>
            <Grid item xs={12}><CircularProgress color='inherit' /></Grid>
            <Grid item xs={12}>Loading section data from Canvas</Grid>
          </Grid>
        </Backdrop>
      </div>
      <Grid container className={classes.buttonGroup} justifyContent='space-between'>
        <Button variant='outlined' aria-label='Back to select input method' onClick={props.resetFeature}>
          Back
        </Button>
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

  const renderRowValidationErrors = (errors: RowValidationError[]): JSX.Element => {
    return (
      <>
      {file !== undefined && <CSVFileName file={file} />}
      <RowLevelErrorsContent
        table={<ValidationErrorTable invalidations={errors} />}
        title='Review your CSV file'
        resetUpload={handleEnrollmentsReset}
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
      <ErrorAlert messages={errors} tryAgain={handleEnrollmentsReset} />
      </>
    )
  }

  const getUploadContent = (): JSX.Element => {
    if (schemaInvalidations !== undefined) return renderSchemaInvalidations(schemaInvalidations)
    if (rowInvalidations !== undefined) return renderRowValidationErrors(rowInvalidations)

    const fileData =
    `${REQUIRED_ENROLLMENT_HEADERS.join(',')}\n` +
    'studentone, student\n'

    const fileDownloadHeaderProps: ExampleFileDownloadHeaderProps = {
      body: (
        <Typography>
          Your file should include a {USER_ID_TEXT} (uniqname) and a {USER_ROLE_TEXT} for each user. {MAX_ENROLLMENT_MESSAGE}
        </Typography>
      ),
      fileData,
      fileName: 'add_um_users.csv'
    }

    return (
      <div>
        <ExampleFileDownloadHeader {...fileDownloadHeaderProps} />
        <FileUpload onUploadComplete={handleFile} />
        <Grid container className={classes.buttonGroup} justifyContent='flex-start'>
          <Button
            variant='outlined'
            aria-label='Back to Select Section'
            onClick={async () => {
              setSelectedSection(undefined)
              setActiveStep(CSVWorkflowStep.Select)
              await props.doGetSections()
            }}
          >
            Back
          </Button>
        </Grid>
      </div>
    )
  }

  const renderConfirm = (section: CanvasCourseSectionWithCourseName, enrollments: RowNumberedAddEnrollment[]): JSX.Element => {
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
            <Grid item xs={12}><CircularProgress color='inherit' /></Grid>
            <Grid item xs={12}>Sending enrollment data...</Grid>
            <Grid item xs={12}>
              Please stay on the page. This process may take several seconds for larger files.
            </Grid>
          </Grid>
        </Backdrop>
      </div>
    )
  }

  const getSuccessContent = (): JSX.Element => {
    const settingsLink = <Link href={props.settingsURL} target='_parent'>Canvas Settings page</Link>
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
        <Button variant='outlined' aria-label={`Start ${props.featureTitle} again`} onClick={props.resetFeature}>
          Start Again
        </Button>
      </Grid>
      </>
    )
  }

  const getStepContent = (step: CSVWorkflowStep): JSX.Element => {
    switch (step) {
      case CSVWorkflowStep.Select:
        return getSelectContent()
      case CSVWorkflowStep.Upload:
        return getUploadContent()
      case CSVWorkflowStep.Review:
        if (addEnrollmentsError !== undefined) {
          return <BulkApiErrorContent error={addEnrollmentsError} file={file} tryAgain={handleUploadReset} />
        }
        if (selectedSection !== undefined && enrollments !== undefined) {
          return renderConfirm(selectedSection, enrollments)
        }
        return <ErrorAlert />
      case CSVWorkflowStep.Confirmation:
        return getSuccessContent()
      default:
        return <ErrorAlert />
    }
  }

  return (
    <>
    <Typography variant='h6' component='h2'>Add Users to Single Section</Typography>
    <WorkflowStepper allSteps={Object(CSVWorkflowStep)} activeStep={activeStep} />
    {getStepContent(activeStep)}
    </>
  )
}
