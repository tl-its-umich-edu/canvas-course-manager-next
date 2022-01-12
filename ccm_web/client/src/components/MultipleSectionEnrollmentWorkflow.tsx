import React, { useState } from 'react'
import { Button, makeStyles, Typography } from '@material-ui/core'

import CSVFileName from './CSVFileName'
import ExampleFileDownloadHeader from './ExampleFileDownloadHeader'
import RowLevelErrorsContent from './RowLevelErrorsContent'
import { CanvasCourseSectionWithCourseName } from '../models/canvas'
import { AddEnrollmentWithSectionID } from '../models/enrollment'
import { InvalidationType } from '../models/models'
import ValidationErrorTable, { RowValidationError } from './ValidationErrorTable'
import CSVSchemaValidator, { SchemaInvalidation } from '../utils/CSVSchemaValidator'
import {
  EnrollmentInvalidation, LoginIDRowsValidator, RoleRowsValidator
} from '../utils/enrollmentValidators'

import FileParserWrapper, { CSVRecord } from '../utils/FileParserWrapper'
import ErrorAlert from './ErrorAlert'
import FileUpload from './FileUpload'

enum CSVWorkflowState {
  Upload,
  Review,
  Confirm
}

const REQUIRED_HEADERS = ['LOGIN_ID', 'ROLE', 'SECTION_ID']

const useStyles = makeStyles((theme) => ({
  buttonGroup: {
    marginTop: theme.spacing(1)
  }
}))

interface EnrollmentWithSectionIDRecord extends CSVRecord {
  LOGIN_ID: string
  ROLE: string
  SECTION_ID: string
}

const isEnrollmentWithSectionIDRecord = (record: CSVRecord): record is EnrollmentWithSectionIDRecord => {
  return REQUIRED_HEADERS.every(h => typeof record[h] === 'string')
}

interface MultipleSectionEnrollmentWorkflowProps {
  sections: CanvasCourseSectionWithCourseName[]
}

export default function MultipleSectionEnrollmentWorkflow (props: MultipleSectionEnrollmentWorkflowProps): JSX.Element {
  const classes = useStyles()

  const [workflowState, setWorkflowState] = useState<CSVWorkflowState>(CSVWorkflowState.Upload)

  const [file, setFile] = useState<File | undefined>(undefined)
  // const [validEnrollments, setValidEnrollments] = useState<AddEnrollmentWithSectionID[] | undefined>(undefined)

  const [schemaInvalidations, setSchemaInvalidations] = useState<SchemaInvalidation[] | undefined>(undefined)
  const [rowInvalidations, setRowInvalidations] = useState<EnrollmentInvalidation[] | undefined>(undefined)

  const renderRowValidationErrors = (errors: RowValidationError[]): JSX.Element => {
    return (
      <>
      {file !== undefined && <CSVFileName file={file} />}
      <RowLevelErrorsContent
        table={<ValidationErrorTable invalidations={errors} />}
        title='Review your CSV file'
        resetUpload={() => undefined}
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
      <ErrorAlert messages={errors} tryAgain={() => undefined} />
      </>
    )
  }

  const renderUpload = (): JSX.Element => {
    if (schemaInvalidations !== undefined) return renderSchemaInvalidations(schemaInvalidations)
    if (rowInvalidations !== undefined) return renderRowValidationErrors(rowInvalidations)

    const requirements = (
      <Typography>
        Your file should include a login ID (uniqname), a role, and a section ID for each user.
        The maximum number of user enrollments allowed is 400.
      </Typography>
    )

    const fileData = (
      'LOGIN_ID,ROLE,SECTION_ID\n' +
      'teacherone,teacher,1001\n' +
      'teacherone,teacher,1002\n' +
      'studentone,student,1001\n' +
      'studenttwo,student,1002\n' +
      'taone,ta,1001\n' +
      'tatwo,ta,1002\n'
    )

    const handleValidation = (headers: string[] | undefined, rowData: CSVRecord[]): void => {
      const schemaValidator = new CSVSchemaValidator<EnrollmentWithSectionIDRecord>(
        REQUIRED_HEADERS, isEnrollmentWithSectionIDRecord, 400
      )
      const validationResult = schemaValidator.validate(headers, rowData)
      if (!validationResult.valid) return setSchemaInvalidations(validationResult.schemaInvalidations)

      const enrollmentRecords = validationResult.validData
      const errors: EnrollmentInvalidation[] = []

      if (errors.length > 0) return setRowInvalidations(errors)

      // setValidEnrollments(externalEnrollments)
      setWorkflowState(CSVWorkflowState.Review)
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
          body={requirements}
          fileName='add_non_um_users.csv'
          fileData={fileData}
        />
        <FileUpload onUploadComplete={handleFile} />
        <div className={classes.buttonGroup}>
          <Button variant='outlined' aria-label='Back to select section' onClick={() => undefined}>Back</Button>
        </div>
      </div>
    )
  }

  const renderWorkflowState = (state: CSVWorkflowState): JSX.Element => {
    switch (state) {
      case CSVWorkflowState.Upload:
        return renderUpload()
      default:
        return <ErrorAlert />
    }
  }

  return (
    <>
    <Typography variant='h6' component='h2'>Add Users to Multiple Sections</Typography>
    {renderWorkflowState(workflowState)}
    </>
  )
}
