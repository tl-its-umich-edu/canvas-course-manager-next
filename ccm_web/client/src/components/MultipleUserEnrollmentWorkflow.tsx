import React, { useState } from 'react'
import { styled } from '@mui/material/styles'
import { Backdrop, Button, CircularProgress, Grid, Typography, Link } from '@mui/material'

import APIErrorMessage from './APIErrorMessage.js'
import APIErrorsTable from './APIErrorsTable.js'
import BulkEnrollExternalUserConfirmationTable from './BulkEnrollExternalUserConfirmationTable.js'
import ConfirmDialog from './ConfirmDialog.js'
import CreateSelectSectionWidget, { CreateSelectSectionWidgetCreateProps } from './CreateSelectSectionWidget.js'
import CSVFileName from './CSVFileName.js'
import ErrorAlert from './ErrorAlert.js'
import ExampleFileDownloadHeader from './ExampleFileDownloadHeader.js'
import FileUpload from './FileUpload.js'
import RowLevelErrorsContent from './RowLevelErrorsContent.js'
import SuccessCard from './SuccessCard.js'
import ValidationErrorTable from './ValidationErrorTable.js'
import WorkflowStepper from './WorkflowStepper.js'
import CanvasSettingsLink from './CanvasSettingsLink.js'
import * as api from '../api.js'
import usePromise from '../hooks/usePromise.js'
import {
  CanvasCourseBase, CanvasCourseSection, CanvasCourseSectionWithCourseName, ClientEnrollmentType, injectCourseName
} from '../models/canvas.js'
import { AddNewExternalUserEnrollment, RowNumberedAddNewExternalUserEnrollment } from '../models/enrollment.js'
import { ExternalUserSuccess, isExternalUserSuccess } from '../models/externalUser.js'
import { createSectionRoles } from '../models/feature.js'
import { AddNonUMUsersLeafProps, isAuthorizedForRoles } from '../models/FeatureUIData.js'
import { CSVWorkflowStep, InvalidationType, RoleEnum } from '../models/models.js'
import CSVSchemaValidator, { SchemaInvalidation } from '../utils/CSVSchemaValidator.js'
import {
  DuplicateEmailRowsValidator, EmailRowsValidator, EnrollmentInvalidation, FirstNameRowsValidator,
  LastNameRowsValidator, RoleRowsValidator
} from '../utils/enrollmentValidators.js'
import FileParserWrapper, { CSVRecord } from '../utils/FileParserWrapper.js'
import { getRowNumber } from '../utils/fileUtils.js'
import { CanvasError, ErrorDescription, ExternalUserProcessError } from '../utils/handleErrors.js'

const PREFIX = 'MultipleUserEnrollmentWorkflow'

const classes = {
  backdrop: `${PREFIX}-backdrop`,
  container: `${PREFIX}-container`,
  buttonGroup: `${PREFIX}-buttonGroup`,
  table: `${PREFIX}-table`
}

const Root = styled('div')((
  {
    theme
  }
) => ({
  [`& .${classes.backdrop}`]: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#FFF',
    position: 'absolute',
    textAlign: 'center'
  },

  [`& .${classes.container}`]: {
    position: 'relative',
    zIndex: 0
  },

  [`& .${classes.buttonGroup}`]: {
    marginTop: theme.spacing(1)
  },

  [`& .${classes.table}`]: {
    paddingLeft: 10,
    paddingRight: 10
  }
}))

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

interface MultipleUserEnrollmentWorkflowProps extends AddNonUMUsersLeafProps {
  course: CanvasCourseBase
  onSectionCreated: (newSection: CanvasCourseSection) => void
  userCourseRoles: RoleEnum[]
}

export default function MultipleUserEnrollmentWorkflow (props: MultipleUserEnrollmentWorkflowProps): JSX.Element {
  const [activeStep, setActiveStep] = useState<CSVWorkflowStep>(CSVWorkflowStep.Select)
  const [selectedSection, setSelectedSection] = useState<CanvasCourseSectionWithCourseName | undefined>(undefined)

  const [file, setFile] = useState<File | undefined>(undefined)
  const [validEnrollments, setValidEnrollments] = useState<RowNumberedAddNewExternalUserEnrollment[] | undefined>(undefined)

  const [schemaInvalidations, setSchemaInvalidations] = useState<SchemaInvalidation[] | undefined>(undefined)
  const [rowInvalidations, setRowInvalidations] = useState<EnrollmentInvalidation[] | undefined>(undefined)

  const [processErrors, setProcessErrors] = useState<ErrorDescription[] | undefined>(undefined)

  const [
    doAddExternalEnrollments, isAddExternalEnrollmentsLoading, addExternalEnrollmentsError,
    clearAddExternalEnrollmentsError
  ] = usePromise(
    async (sectionId: number, enrollments: AddNewExternalUserEnrollment[]): Promise<ErrorDescription[]> => {
      let successes: ExternalUserSuccess[]
      const errors: ErrorDescription[] = []
      try {
        successes = await api.createExternalUsers(
          enrollments.map(e => ({ email: e.email, givenName: e.firstName, surname: e.lastName })),
        )
      } catch (error: unknown) {
        if (error instanceof ExternalUserProcessError) {
          errors.push(...error.describeErrors())
          successes = error.data.filter(r => isExternalUserSuccess(r)) as ExternalUserSuccess[]
        } else {
          throw error
        }
      }
      const allUsersToEnroll = successes.map(s => s.email)
      const enrollmentsToAdd = enrollments.filter(e => allUsersToEnroll.includes(e.email))

      if (enrollmentsToAdd.length > 0) {
        try {
          await api.addSectionEnrollments(
            sectionId, enrollmentsToAdd.map(e => ({ loginId: e.email, role: e.role })))
        } catch (error: unknown) {
          if (error instanceof CanvasError) {
            errors.push(...error.describeErrors('enrolling a user to a Canvas section'))
          } else {
            throw error
          }
        }
      }

      return errors
    },
    (errors: ErrorDescription[]) => {
      setProcessErrors(errors)
      if (errors.length === 0) setActiveStep(CSVWorkflowStep.Confirmation)
    }
  )

  const handleResetUpload = (): void => {
    setFile(undefined)
    setValidEnrollments(undefined)
    clearAddExternalEnrollmentsError()
    setSchemaInvalidations(undefined)
    setRowInvalidations(undefined)
  }

  const getSectionsErrorAlert = (
    <ErrorAlert
      messages={[<APIErrorMessage key={0} context='loading section data' error={props.getSectionsError} />]}
      tryAgain={props.doGetSections}
    />
  )

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
    if (props.getSectionsError !== undefined) return getSectionsErrorAlert

    const canCreate = isAuthorizedForRoles(props.userCourseRoles, createSectionRoles)
    const onSectionCreated = (section: CanvasCourseSection): void => {
      setSelectedSection(injectCourseName([section], props.course.name)[0])
      props.onSectionCreated(section)
    }
    const createProps: CreateSelectSectionWidgetCreateProps = canCreate
      ? { canCreate: true, course: props.course, onSectionCreated }
      : { canCreate: false }

    return <>
    <div className={classes.container}>
      <CreateSelectSectionWidget
        sections={props.sections}
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
        {...createProps} />
      <Backdrop className={classes.backdrop} open={props.isGetSectionsLoading}>
        <Grid container>
          <Grid item xs={12}><CircularProgress color='inherit' /></Grid>
          <Grid item xs={12}>Loading section data from Canvas</Grid>
        </Grid>
      </Backdrop>
    </div>
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
        disabled={selectedSection === undefined || props.isGetSectionsLoading}
        onClick={() => setActiveStep(CSVWorkflowStep.Upload)}
      >
        Select
      </Button>
    </Grid>
    </>
  }

  const renderUpload = (): JSX.Element => {
    if (schemaInvalidations !== undefined) return renderSchemaInvalidations(schemaInvalidations)
    if (rowInvalidations !== undefined) return renderRowValidationErrors(rowInvalidations)

    const description = (
      'This tool will enroll non-UM users in the selected section. ' +
      'If they do not have an account in Canvas, they will be sent an email ' +
      'invitation to choose a login method and added to Canvas before they are enrolled in the section.'
    )
    const roleLink = 'https://teamdynamix.umich.edu/TDClient/30/Portal/KB/ArticleDet?ID=192'
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
            &quot;{ROLE_HEADER.toLowerCase()}&quot; with one of the Canvas roles you are allowed to enroll users with <Link href={roleLink} target='_blank' rel="noopener">(see documentation)</Link>;
          </Typography>
        </li>
        <li>
          <Typography>
          &quot;{FIRST_NAME_HEADER.toLowerCase()}&quot; with the user&apos;s first name (between 1 and 255 characters in length);
          </Typography>
        </li>
        <li>
          <Typography>
            &quot;{LAST_NAME_HEADER.toLowerCase()}&quot; with the user&apos;s last name (between 1 and 255 characters in length).
          </Typography>
        </li>
      </ul>
      </>
    )
    const fileData = (
      `${EMAIL_HEADER},${ROLE_HEADER},${FIRST_NAME_HEADER},${LAST_NAME_HEADER}\n` +
      'jdoe@example.edu,student,jane,doe'
    )

    const handleBackClick = async (): Promise<void> => {
      handleResetUpload()
      setSelectedSection(undefined)
      setActiveStep(CSVWorkflowStep.Select)
      await props.doGetSections()
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

      const rolesValidator = new RoleRowsValidator(props.rolesUserCanEnroll)
      errors.push(...rolesValidator.validate(externalRecords.map(r => r[ROLE_HEADER])))

      if (errors.length > 0) return setRowInvalidations(errors)

      const externalEnrollments: RowNumberedAddNewExternalUserEnrollment[] = externalRecords.map((r, i) => ({
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

  const renderReview = (sectionId: number, enrollments: RowNumberedAddNewExternalUserEnrollment[]): JSX.Element => {
    return (
      <div className={classes.container}>
        {file !== undefined && <CSVFileName file={file} />}
        <Grid container>
            <Grid item xs={12} sm={9} sx={{ order: { xs: 2, sm: 1 } }} className={classes.table}>
              <BulkEnrollExternalUserConfirmationTable enrollments={enrollments} />
            </Grid>
            <Grid item xs={12} sm={3} sx={{ order: { xs: 1, sm: 2 } }}>
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
        </Grid>
        <Backdrop className={classes.backdrop} open={isAddExternalEnrollmentsLoading}>
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

  const renderPartialSuccess = (errors: ErrorDescription[]): JSX.Element => {
    return (
      <>
      {file !== undefined && <CSVFileName file={file} />}
      <RowLevelErrorsContent
        table={<APIErrorsTable errors={errors} includeContext />}
        title='Some errors occurred'
        message={<Typography>One or more errors occurred while processing non-UM users.</Typography>}
        resetUpload={() => {
          handleResetUpload()
          setProcessErrors(undefined)
          setActiveStep(CSVWorkflowStep.Upload)
        }}
      />
      </>
    )
  }

  const renderSuccess = (): JSX.Element => {
    const message = (
      <>
      <Typography>
        Non-UM Users have been added to the selected section!
      </Typography>
      <Typography>
        New users have also been added to Canvas and sent an email invitation to choose a login method.
      </Typography>
      </>
    )
    const nextAction = (
      <span>See the users in the course&apos;s sections on the <CanvasSettingsLink url={props.settingsURL} /> for your course.</span>
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
          const errorMessage = (
            <APIErrorMessage key={0} error={addExternalEnrollmentsError} context='processing non-UM users' />
          )
          return (
            <ErrorAlert
              messages={[errorMessage]}
              tryAgain={() => {
                handleResetUpload()
                setActiveStep(CSVWorkflowStep.Upload)
              }}
            />
          )
        }
        if (processErrors !== undefined) return renderPartialSuccess(processErrors)
        return renderReview(selectedSection.id, validEnrollments)
      case CSVWorkflowStep.Confirmation:
        return renderSuccess()
      default:
        return <ErrorAlert />
    }
  }

  return (
    <Root>
      <Grid>
        <Typography variant='h6' component='h3'>Add Multiple Users Through CSV</Typography>
        <WorkflowStepper allSteps={Object(CSVWorkflowStep)} activeStep={activeStep} />
        <div>{renderActiveStep(activeStep)}</div>
      </Grid>
    </Root>
  )
}
