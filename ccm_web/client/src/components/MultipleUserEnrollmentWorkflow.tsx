import React, { useState } from 'react'
import { Button, Grid, makeStyles, Typography } from '@material-ui/core'

import CreateSelectSectionWidget from './CreateSelectSectionWidget'
import ErrorAlert from './ErrorAlert'
import ExampleFileDownloadHeader from './ExampleFileDownloadHeader'
import FileUpload from './FileUpload'
import { SelectableCanvasCourseSection } from './SectionSelectorWidget'
import WorkflowStepper from './WorkflowStepper'
import { CanvasCourseBase, CanvasCourseSection } from '../models/canvas'
import { InvalidationType } from '../models/models'
import CSVSchemaValidator, { SchemaInvalidation } from '../utils/CSVSchemaValidator'
import FileParserWrapper, { CSVRecord } from '../utils/FileParserWrapper'

interface EnrollmentInvalidation {
  message: string
  type: InvalidationType
}

const EMAIL_HEADER = 'EMAIL'
const ROLE_HEADER = 'ROLE'
const FIRST_NAME_HEADER = 'FIRST_NAME'
const LAST_NAME_HEADER = 'LAST_NAME'

interface UserEnrollmentRecord extends CSVRecord {
  EMAIL: string
  ROLE: string
  FIRST_NAME: string
  LAST_NAME: string
}

enum CSVWorkflowStep {
  Select,
  Upload,
  Review,
  Success
}

const useStyles = makeStyles((theme) => ({
  buttonGroup: {
    marginTop: theme.spacing(1)
  }
}))

interface MultipleUserEnrollmentWorkflowProps {
  course: CanvasCourseBase
  sections: SelectableCanvasCourseSection[]
  onSectionCreated: (newSection: CanvasCourseSection) => void
}

export default function MultipleUserEnrollmentWorkflow (props: MultipleUserEnrollmentWorkflowProps): JSX.Element {
  const classes = useStyles()

  const [activeStep, setActiveStep] = useState<CSVWorkflowStep>(CSVWorkflowStep.Select)
  const [selectedSection, setSelectedSection] = useState<SelectableCanvasCourseSection | undefined>(undefined)

  const [file, setFile] = useState<File | undefined>(undefined)
  const [records, setRecords] = useState<UserEnrollmentRecord[] | undefined>(undefined)
  const [processedRecords, setProcessedRecords] = useState<UserEnrollmentRecord[] | undefined>(undefined)

  const [schemaInvalidations, setSchemaInvalidations] = useState<SchemaInvalidation[] | undefined>(undefined)
  const [enrollmentInvalidations, setEnrollmentInvalidations] = useState<EnrollmentInvalidation[] | undefined>(undefined)

  const handleResetUpload = (): void => {
    setFile(undefined)
    setRecords(undefined)
    setProcessedRecords(undefined)
    setSchemaInvalidations(undefined)
    setEnrollmentInvalidations(undefined)
  }

  const renderSchemaInvalidations = (invalidations: SchemaInvalidation[]): JSX.Element => {
    const messages = invalidations.map(
      (invalidation, i) => <Typography key={i}>{invalidation.message}</Typography>
    )
    return <ErrorAlert messages={messages} tryAgain={handleResetUpload} />
  }

  const renderSelect = (): JSX.Element => {
    return (
      <>
      <CreateSelectSectionWidget
        {...props}
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
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

  const renderUpload = (): JSX.Element => {
    if (schemaInvalidations !== undefined) {
      return renderSchemaInvalidations(schemaInvalidations)
    }

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
          &quot;{FIRST_NAME_HEADER.toLowerCase()}&quot; with the user&apos;ss first name (between one and 255 characters in length);
          </Typography>
        </li>
        <li>
          <Typography>
            and &quot;{LAST_NAME_HEADER.toLowerCase()}&quot; with the user&apos;ss last name (between one and 255 characters in length).
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

    return (
      <div>
        <ExampleFileDownloadHeader
          description={description}
          body={requirements}
          fileName='add_non_um_users.csv'
          fileData={fileData}
        />
        <FileUpload onUploadComplete={(file) => setFile(file)} />
        <div className={classes.buttonGroup}>
          <Button onClick={handleBackClick}>Back</Button>
        </div>
      </div>
    )
  }

  const renderActiveStep = (activeStep: CSVWorkflowStep): JSX.Element => {
    switch (activeStep) {
      case CSVWorkflowStep.Select:
        return renderSelect()
      case CSVWorkflowStep.Upload:
        return renderUpload()
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
