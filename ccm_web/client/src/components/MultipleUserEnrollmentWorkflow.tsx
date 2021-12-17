import React, { useState } from 'react'
import { Backdrop, Box, Button, CircularProgress, Grid, makeStyles, Typography } from '@material-ui/core'

import BulkEnrollExternalUserConfirmationTable from './BulkEnrollExternalUserConfirmationTable'
import ConfirmDialog from './ConfirmDialog'
import CreateSelectSectionWidget from './CreateSelectSectionWidget'
import CSVFileName from './CSVFileName'
import ErrorAlert from './ErrorAlert'
import ExampleFileDownloadHeader from './ExampleFileDownloadHeader'
import FileUpload from './FileUpload'
import RowLevelErrorsContent from './RowLevelErrorsContent'
import { SelectableCanvasCourseSection } from './SectionSelectorWidget'
import ValidationErrorTable, { RowValidationError } from './ValidationErrorTable'
import WorkflowStepper from './WorkflowStepper'
import { CanvasCourseBase, CanvasCourseSection, ClientEnrollmentType, isValidRole } from '../models/canvas'
import { AddNumberedNewExternalUserEnrollment } from '../models/enrollment'
import { InvalidationType } from '../models/models'
import CSVSchemaValidator, { SchemaInvalidation } from '../utils/CSVSchemaValidator'
import FileParserWrapper, { CSVRecord } from '../utils/FileParserWrapper'
import { emailSchema, firstNameSchema, lastNameSchema, validateString, ValidationResult } from '../utils/validation'

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

enum CSVWorkflowStep {
  Select,
  Upload,
  Review,
  Confirmation
}

const useStyles = makeStyles((theme) => ({
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
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

interface MultipleUserEnrollmentWorkflowProps {
  course: CanvasCourseBase
  sections: SelectableCanvasCourseSection[]
  onSectionCreated: (newSection: CanvasCourseSection) => void
  rolesUserCanAdd: ClientEnrollmentType[]
  resetFeature: () => void
}

export default function MultipleUserEnrollmentWorkflow (props: MultipleUserEnrollmentWorkflowProps): JSX.Element {
  const classes = useStyles()

  const [activeStep, setActiveStep] = useState<CSVWorkflowStep>(CSVWorkflowStep.Select)
  const [selectedSection, setSelectedSection] = useState<SelectableCanvasCourseSection | undefined>(undefined)

  const [file, setFile] = useState<File | undefined>(undefined)
  const [validRecords, setValidRecords] = useState<AddNumberedNewExternalUserEnrollment[] | undefined>(undefined)

  const [schemaInvalidations, setSchemaInvalidations] = useState<SchemaInvalidation[] | undefined>(undefined)
  const [rowValidationErrors, setRowValidationErrors] = useState<RowValidationError[] | undefined>(undefined)

  const handleResetUpload = (): void => {
    setFile(undefined)
    setValidRecords(undefined)
    setSchemaInvalidations(undefined)
    setRowValidationErrors(undefined)
  }

  const renderSchemaInvalidations = (invalidations: SchemaInvalidation[]): JSX.Element => {
    const messages = invalidations.map(
      (invalidation, i) => <Typography key={i}>{invalidation.message}</Typography>
    )
    return <ErrorAlert messages={messages} tryAgain={handleResetUpload} />
  }

  const renderRowValidationErrors = (errors: RowValidationError[]): JSX.Element => {
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
    return (
      <>
      <CreateSelectSectionWidget
        {...props}
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
      />
      <Grid container className={classes.buttonGroup} justifyContent='space-between'>
        <Button
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
    if (rowValidationErrors !== undefined) return renderRowValidationErrors(rowValidationErrors)

    const description = (
      'This tool will try to enroll non-UM users in the selected section. ' +
      'If they have not yet been invited to create a friend account, they will be sent an invite and added to Canvas.'
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
            &quot;{ROLE_HEADER.toLowerCase()}&quot; with a new Canvas role for each user that is less privileged than your role;
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

      const getMessage = (result: ValidationResult, fieldName: string): string => {
        return result.messages.length > 0 ? result.messages[0] : `Value for ${fieldName} is invalid.`
      }

      const externalEnrollments: AddNumberedNewExternalUserEnrollment[] = []
      const externalRecords = validationResult.validData
      const errors: RowValidationError[] = []
      externalRecords.forEach((r, i) => {
        const rowNumber = i + 2
        const email = r[EMAIL_HEADER]
        const emailValidationResult = validateString(email, emailSchema)
        const role = r[ROLE_HEADER]
        const firstName = r[FIRST_NAME_HEADER]
        const firstNameValidationResult = validateString(firstName, firstNameSchema)
        const lastName = r[LAST_NAME_HEADER]
        const lastNameValidationResult = validateString(lastName, lastNameSchema)
        if (!emailValidationResult.isValid) {
          errors.push({ rowNumber, message: getMessage(emailValidationResult, 'email address') })
        } else if (!isValidRole(role) || !props.rolesUserCanAdd.includes(role)) {
          console.log(role)
          errors.push({
            rowNumber,
            message: (
              `Value for ${ROLE_HEADER.toLowerCase()} '${role}' is invalid. ` +
              'Ensure it is a valid Canvas role and is less privileged than your own role.'
            )
          })
        } else if (!firstNameValidationResult.isValid) {
          errors.push({ rowNumber, message: getMessage(firstNameValidationResult, 'first name') })
        } else if (!lastNameValidationResult.isValid) {
          errors.push({ rowNumber, message: getMessage(lastNameValidationResult, 'last name') })
        } else {
          externalEnrollments.push({ rowNumber, email, role, firstName, lastName })
        }
      })
      if (errors.length > 0) return setRowValidationErrors(errors)
      setValidRecords(externalEnrollments)
      setActiveStep(CSVWorkflowStep.Review)
      return setValidRecords(externalEnrollments)
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
          <Button onClick={handleBackClick}>Back</Button>
        </div>
      </div>
    )
  }

  const renderReview = (enrollments: AddNumberedNewExternalUserEnrollment[]): JSX.Element => {
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
                submit={async () => undefined}
                cancel={() => {
                  handleResetUpload()
                  setActiveStep(CSVWorkflowStep.Upload)
                }}
                disabled={false} // Disable this while enrollments are processing
              />
            </Grid>
          </Box>
        </Grid>
        <Backdrop className={classes.backdrop} open={false}>
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

  const renderActiveStep = (activeStep: CSVWorkflowStep): JSX.Element => {
    switch (activeStep) {
      case CSVWorkflowStep.Select:
        return renderSelect()
      case CSVWorkflowStep.Upload:
        return renderUpload()
      case CSVWorkflowStep.Review:
        if (validRecords === undefined) return <ErrorAlert />
        return renderReview(validRecords)
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
