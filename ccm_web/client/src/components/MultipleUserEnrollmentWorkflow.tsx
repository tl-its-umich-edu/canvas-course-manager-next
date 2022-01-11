import React, { useState } from 'react'
import { Backdrop, Box, Button, CircularProgress, Grid, Link, makeStyles, Typography } from '@material-ui/core'

import BulkApiErrorContent from './BulkApiErrorContent'
import BulkEnrollExternalUserConfirmationTable from './BulkEnrollExternalUserConfirmationTable'
import ConfirmDialog from './ConfirmDialog'
import CreateSelectSectionWidget, { CreateSelectSectionWidgetCreateProps } from './CreateSelectSectionWidget'
import CSVFileName from './CSVFileName'
import ErrorAlert from './ErrorAlert'
import ExampleFileDownloadHeader from './ExampleFileDownloadHeader'
import FileUpload from './FileUpload'
import RowLevelErrorsContent from './RowLevelErrorsContent'
import SuccessCard from './SuccessCard'
import ValidationErrorTable from './ValidationErrorTable'
import WorkflowStepper from './WorkflowStepper'
import usePromise from '../hooks/usePromise'
import { CanvasCourseBase, CanvasCourseSection, CanvasCourseSectionWithCourseName, ClientEnrollmentType } from '../models/canvas'
import { AddNewExternalUserEnrollment, AddNumberedNewExternalUserEnrollment } from '../models/enrollment'
import { createSectionRoles } from '../models/feature'
import { AddNonUMUsersLeafProps, isAuthorizedForRoles } from '../models/FeatureUIData'
import { CSVWorkflowStep, InvalidationType, RoleEnum } from '../models/models'
import CSVSchemaValidator, { SchemaInvalidation } from '../utils/CSVSchemaValidator'
import {
  DuplicateEmailRowsValidator, EmailRowsValidator, EnrollmentInvalidation, FirstNameRowsValidator,
  LastNameRowsValidator, RoleRowsValidator
} from '../utils/enrollmentValidators'
import FileParserWrapper, { CSVRecord } from '../utils/FileParserWrapper'
import { getRowNumber } from '../utils/fileUtils'

const EMAIL_HEADER = 'EMAIL'
const ROLE_HEADER = 'ROLE'
const FIRST_NAME_HEADER = 'FIRST_NAME'
const LAST_NAME_HEADER = 'LAST_NAME'

const REQUIRED_HEADERS = [EMAIL_HEADER, ROLE_HEADER, FIRST_NAME_HEADER, LAST_NAME_HEADER]

interface ExternalEnrollmentRecord extends CSVRecord {
  EMAIL: string
  ROLE: string
  FIRST_NAME: string
  LAST_NAME: string
}

export const isExternalEnrollmentRecord = (record: CSVRecord): record is ExternalEnrollmentRecord => {
  return REQUIRED_HEADERS.every(h => typeof record[h] === 'string')
}

const useStyles = makeStyles((theme) => ({
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#FFF',
    position: 'absolute',
    textAlign: 'center'
  },
  confirmContainer: {
    position: 'relative',
    zIndex: 0
  },
  buttonGroup: {
    marginTop: theme.spacing(1)
  },
  table: {
    paddingLeft: 10,
    paddingRight: 10
  }
}))

interface MultipleUserEnrollmentWorkflowProps extends AddNonUMUsersLeafProps {
  course: CanvasCourseBase
  onSectionCreated: (newSection: CanvasCourseSection) => void
  userCourseRoles: RoleEnum[]
}

export default function MultipleUserEnrollmentWorkflow (props: MultipleUserEnrollmentWorkflowProps): JSX.Element {
  const classes = useStyles()

  const [activeStep, setActiveStep] = useState<CSVWorkflowStep>(CSVWorkflowStep.Select)
  const [selectedSection, setSelectedSection] = useState<CanvasCourseSectionWithCourseName | undefined>(undefined)

  const [file, setFile] = useState<File | undefined>(undefined)
  const [validEnrollments, setValidEnrollments] = useState<AddNumberedNewExternalUserEnrollment[] | undefined>(undefined)

  const [schemaInvalidations, setSchemaInvalidations] = useState<SchemaInvalidation[] | undefined>(undefined)
  const [rowInvalidations, setRowInvalidations] = useState<EnrollmentInvalidation[] | undefined>(undefined)

  const [
    doAddExternalEnrollments, isAddExternalEnrollmentsLoading, addExternalEnrollmentsError, clearAddExternalEnrollmentsError
  ] = usePromise(
    async (sectionId: number, enrollments: AddNewExternalUserEnrollment[]) => {
      const promise = new Promise(resolve => setTimeout(resolve, 3000)) // Mocking this for now
      return await promise
    },
    () => { setActiveStep(CSVWorkflowStep.Confirmation) }
  )

  const handleResetUpload = (): void => {
    setFile(undefined)
    setValidEnrollments(undefined)
    clearAddExternalEnrollmentsError()
    setSchemaInvalidations(undefined)
    setRowInvalidations(undefined)
  }

  const renderSchemaInvalidations = (invalidations: SchemaInvalidation[]): JSX.Element => {
    const messages = invalidations.map(
      (invalidation, i) => <Typography key={i}>{invalidation.message}</Typography>
    )
    return <ErrorAlert messages={messages} tryAgain={handleResetUpload} />
  }

  const renderRowValidationErrors = (errors: EnrollmentInvalidation[]): JSX.Element => {
    return (
      <>
      {file !== undefined && <CSVFileName file={file} />}
      <RowLevelErrorsContent
        table={<ValidationErrorTable invalidations={errors} />}
        title='Review your CSV file'
        resetUpload={handleResetUpload}
      />
      </>
    )
  }

  const renderSelect = (): JSX.Element => {
    const canCreate = isAuthorizedForRoles(props.userCourseRoles, createSectionRoles)
    const createProps: CreateSelectSectionWidgetCreateProps = canCreate
      ? { canCreate: true, course: props.course, onSectionCreated: props.onSectionCreated }
      : { canCreate: false }

    return (
      <>
      <CreateSelectSectionWidget
        sections={props.sections}
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
        {...createProps}
      />
      <Grid container className={classes.buttonGroup} justifyContent='space-between'>
        <Button
          variant='outlined'
          onClick={props.resetFeature}
          aria-label='Back to input method select'
        >
          Back
        </Button>
        <Button
          variant='contained'
          color='primary'
          aria-label='Select section'
          disabled={selectedSection === undefined}
          onClick={() => setActiveStep(CSVWorkflowStep.Upload)}
        >
          Select
        </Button>
      </Grid>
      </>
    )
  }

  const renderUpload = (): JSX.Element => {
    if (schemaInvalidations !== undefined) return renderSchemaInvalidations(schemaInvalidations)
    if (rowInvalidations !== undefined) return renderRowValidationErrors(rowInvalidations)

    const description = (
      'This tool will try to enroll non-UM users in the selected section. ' +
      'If they do not have an account in Canvas, they will be sent an email ' +
      'invitation to choose a login method and added to Canvas before they are enrolled in the section.'
    )
    const requirements = (
      <>
      <Typography>
        The file includes four columns of data with corresponding headers:
      </Typography>
      <ul>
        <li>
          <Typography>
            &quot;{EMAIL_HEADER.toLowerCase()}&quot; with each user&apos;s external email address (not from University of Michigan);
          </Typography>
        </li>
        <li>
          <Typography>
            &quot;{ROLE_HEADER.toLowerCase()}&quot; with one of the Canvas roles you are allowed to enroll users with (see documentation);
          </Typography>
        </li>
        <li>
          <Typography>
          &quot;{FIRST_NAME_HEADER.toLowerCase()}&quot; with the user&apos;s first name (between one and 255 characters in length);
          </Typography>
        </li>
        <li>
          <Typography>
            and &quot;{LAST_NAME_HEADER.toLowerCase()}&quot; with the user&apos;s last name (between one and 255 characters in length).
          </Typography>
        </li>
      </ul>
      </>
    )
    const fileData = (
      `${EMAIL_HEADER},${ROLE_HEADER},${FIRST_NAME_HEADER},${LAST_NAME_HEADER}\n` +
      'jdoe@example.edu,student,jane,doe'
    )

    const handleBackClick = (): void => {
      handleResetUpload()
      setActiveStep(CSVWorkflowStep.Select)
    }

    const handleValidation = (headers: string[] | undefined, rowData: CSVRecord[]): void => {
      const schemaValidator = new CSVSchemaValidator<ExternalEnrollmentRecord>(
        REQUIRED_HEADERS, isExternalEnrollmentRecord, 200
      )
      const validationResult = schemaValidator.validate(headers, rowData)
      if (!validationResult.valid) return setSchemaInvalidations(validationResult.schemaInvalidations)

      const externalRecords = validationResult.validData
      const errors: EnrollmentInvalidation[] = []

      const emails = externalRecords.map(r => r[EMAIL_HEADER])
      const emailValidators = [new EmailRowsValidator(), new DuplicateEmailRowsValidator()]
      emailValidators.map(validator => errors.push(...validator.validate(emails)))

      const firstNameValidator = new FirstNameRowsValidator()
      errors.push(...firstNameValidator.validate(externalRecords.map(r => r[FIRST_NAME_HEADER])))

      const lastNameValidator = new LastNameRowsValidator()
      errors.push(...lastNameValidator.validate(externalRecords.map(r => r[LAST_NAME_HEADER])))

      const rolesValidator = new RoleRowsValidator()
      errors.push(...rolesValidator.validate(externalRecords.map(r => r[ROLE_HEADER]), props.rolesUserCanEnroll))

      if (errors.length > 0) return setRowInvalidations(errors)

      const externalEnrollments: AddNumberedNewExternalUserEnrollment[] = externalRecords.map((r, i) => ({
        rowNumber: getRowNumber(i),
        email: r[EMAIL_HEADER],
        role: r[ROLE_HEADER] as ClientEnrollmentType,
        firstName: r[FIRST_NAME_HEADER],
        lastName: r[LAST_NAME_HEADER]
      }))

      setValidEnrollments(externalEnrollments)
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

    return (
      <div>
        <ExampleFileDownloadHeader
          description={description}
          body={requirements}
          fileName='add_non_um_users.csv'
          fileData={fileData}
        />
        <FileUpload onUploadComplete={handleFile} />
        <div className={classes.buttonGroup}>
          <Button variant='outlined' aria-label='Back to select section' onClick={handleBackClick}>Back</Button>
        </div>
      </div>
    )
  }

  const renderReview = (sectionId: number, enrollments: AddNumberedNewExternalUserEnrollment[]): JSX.Element => {
    return (
      <div className={classes.confirmContainer}>
        {file !== undefined && <CSVFileName file={file} />}
        <Grid container>
          <Box clone order={{ xs: 2, sm: 1 }}>
            <Grid item xs={12} sm={9} className={classes.table}>
              <BulkEnrollExternalUserConfirmationTable enrollments={enrollments} />
            </Grid>
          </Box>
          <Box clone order={{ xs: 1, sm: 2 }}>
            <Grid item xs={12} sm={3}>
              <ConfirmDialog
                submit={async () => {
                  await doAddExternalEnrollments(sectionId, enrollments.map(({ rowNumber, ...others }) => others))
                }}
                cancel={() => {
                  handleResetUpload()
                  setActiveStep(CSVWorkflowStep.Upload)
                }}
                disabled={isAddExternalEnrollmentsLoading}
              />
            </Grid>
          </Box>
        </Grid>
        <Backdrop className={classes.backdrop} open={isAddExternalEnrollmentsLoading}>
          <Grid container>
            <Grid item xs={12}>
              <CircularProgress color='inherit' />
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

  const renderSuccess = (): JSX.Element => {
    const settingsLink = (
      <Link href={props.settingsURL} target='_parent'>Canvas Settings page</Link>
    )
    // Need to process actual result here somehow
    const message = (
      <Typography>
        Non-UM Users have been added to the selected section!
        New users have also been added to Canvas and sent an email invitation to choose a login method.
      </Typography>
    )
    const nextAction = (
      <span>See the users in the course&apos;s sections on the {settingsLink} for your course.</span>
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

  const renderActiveStep = (activeStep: CSVWorkflowStep): JSX.Element => {
    switch (activeStep) {
      case CSVWorkflowStep.Select:
        return renderSelect()
      case CSVWorkflowStep.Upload:
        return renderUpload()
      case CSVWorkflowStep.Review:
        if (validEnrollments === undefined || selectedSection === undefined) return <ErrorAlert />
        if (addExternalEnrollmentsError !== undefined) {
          return <BulkApiErrorContent error={addExternalEnrollmentsError} file={file} tryAgain={handleResetUpload} />
        }
        return renderReview(selectedSection.id, validEnrollments)
      case CSVWorkflowStep.Confirmation:
        return renderSuccess()
      default:
        return <ErrorAlert />
    }
  }

  return (
    <div>
      <Grid>
        <Typography variant='h6' component='h3'>Add Multiple Users Through CSV</Typography>
        <WorkflowStepper allSteps={Object(CSVWorkflowStep)} activeStep={activeStep} />
        <div>{renderActiveStep(activeStep)}</div>
      </Grid>
    </div>
  )
}
