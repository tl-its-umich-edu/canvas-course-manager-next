import React, { useState } from 'react'
import { Button, makeStyles, Typography } from '@material-ui/core'

import CSVFileName from './CSVFileName'
import ErrorAlert from './ErrorAlert'
import ExampleFileDownloadHeader from './ExampleFileDownloadHeader'
import FileUpload from './FileUpload'
import RowLevelErrorsContent from './RowLevelErrorsContent'
import { CanvasCourseSectionWithCourseName, ClientEnrollmentType } from '../models/canvas'
import { AddRowNumberedEnrollmentWithSectionID } from '../models/enrollment'
import { InvalidationType } from '../models/models'
import ValidationErrorTable, { RowValidationError } from './ValidationErrorTable'
import CSVSchemaValidator, { SchemaInvalidation } from '../utils/CSVSchemaValidator'
import {
  EnrollmentInvalidation, ExistingSectionIDRowsValidator, LoginIDRowsValidator, NumericSectionIDRowsValidator,
  RoleRowsValidator
} from '../utils/enrollmentValidators'
import { getRowNumber } from '../utils/fileUtils'
import FileParserWrapper, { CSVRecord } from '../utils/FileParserWrapper'


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

  const sectionIDs = props.sections.map(s => s.id)

  const [workflowState, setWorkflowState] = useState<CSVWorkflowState>(CSVWorkflowState.Upload)

  const [file, setFile] = useState<File | undefined>(undefined)
  const [validEnrollments, setValidEnrollments] = useState<AddRowNumberedEnrollmentWithSectionID[] | undefined>(undefined)

  const [schemaInvalidations, setSchemaInvalidations] = useState<SchemaInvalidation[] | undefined>(undefined)
  const [rowInvalidations, setRowInvalidations] = useState<EnrollmentInvalidation[] | undefined>(undefined)

  const resetUpload = (): void => {
    setSchemaInvalidations(undefined)
    setRowInvalidations(undefined)
    setFile(undefined)
  }

  const renderRowValidationErrors = (errors: RowValidationError[]): JSX.Element => {
    return (
      <>
      {file !== undefined && <CSVFileName file={file} />}
      <RowLevelErrorsContent
        table={<ValidationErrorTable invalidations={errors} />}
        title='Review your CSV file'
        resetUpload={resetUpload}
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
      <ErrorAlert messages={errors} tryAgain={resetUpload} />
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

      const loginIDValidator = new LoginIDRowsValidator()
      errors.push(...loginIDValidator.validate(enrollmentRecords.map(r => r.LOGIN_ID)))

      const roleValidator = new RoleRowsValidator()
      errors.push(...roleValidator.validate(enrollmentRecords.map(r => r.ROLE)))

      const specifiedSectionIDs = enrollmentRecords.map(r => r.SECTION_ID)
      const sectionIDValidators = [new NumericSectionIDRowsValidator(), new ExistingSectionIDRowsValidator(sectionIDs)]
      sectionIDValidators.map(validator => errors.push(...validator.validate(specifiedSectionIDs)))

      if (errors.length > 0) return setRowInvalidations(errors)

      const enrollmentsWithSectionIDs: AddRowNumberedEnrollmentWithSectionID[] = enrollmentRecords.map((r, i) => {
        return {
          rowNumber: getRowNumber(i),
          loginID: r.LOGIN_ID,
          role: r.ROLE as ClientEnrollmentType,
          sectionID: Number(r.SECTION_ID)
        }
      })
      setValidEnrollments(enrollmentsWithSectionIDs)
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
          fileName='add_non_um_users_with_sections.csv'
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
