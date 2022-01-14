import React, { useState } from 'react'
import {
  Backdrop, Button, Box, CircularProgress, Grid, Link, makeStyles, TableHead, TableContainer, Table, TableBody,
  TableCell, TableRow, Typography
} from '@material-ui/core'

import Accordion from './Accordion'
import BulkApiErrorContent from './BulkApiErrorContent'
import BulkEnrollUMUserToSectionsConfirmationTable from './BulkEnrollUMUserToSectionsConfirmationTable'
import ConfirmDialog from './ConfirmDialog'
import CSVFileName from './CSVFileName'
import ErrorAlert from './ErrorAlert'
import ExampleFileDownloadHeader from './ExampleFileDownloadHeader'
import FileUpload from './FileUpload'
import RowLevelErrorsContent from './RowLevelErrorsContent'
import SuccessCard from './SuccessCard'
import ValidationErrorTable, { RowValidationError } from './ValidationErrorTable'
import * as api from '../api'
import usePromise from '../hooks/usePromise'
import { CanvasCourseBase, CanvasCourseSectionWithCourseName, ClientEnrollmentType, getCanvasRole } from '../models/canvas'
import { AddEnrollmentWithSectionID, AddRowNumberedEnrollmentWithSectionID } from '../models/enrollment'
import { InvalidationType } from '../models/models'
import CSVSchemaValidator, { SchemaInvalidation } from '../utils/CSVSchemaValidator'
import {
  EnrollmentInvalidation, ExistingSectionIDRowsValidator, LoginIDRowsValidator, NumericSectionIDRowsValidator,
  RoleRowsValidator
} from '../utils/enrollmentValidators'
import { CSV_LINK_DOWNLOAD_PREFIX, getRowNumber } from '../utils/fileUtils'
import FileParserWrapper, { CSVRecord } from '../utils/FileParserWrapper'

enum CSVWorkflowState {
  Upload,
  Review,
  Confirmation
}

const REQUIRED_HEADERS = ['LOGIN_ID', 'ROLE', 'SECTION_ID']

const useStyles = makeStyles((theme) => ({
  spacing: {
    marginBottom: theme.spacing(2)
  },
  buttonGroup: {
    marginTop: theme.spacing(1)
  },
  sectionIDTable: {
    maxHeight: 300
  },
  confirmationTable: {
    paddingRight: theme.spacing(1),
    paddingLeft: theme.spacing(1)
  },
  container: {
    position: 'relative',
    zIndex: 0
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#FFF',
    position: 'absolute',
    textAlign: 'center'
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
  course: CanvasCourseBase
  sections: CanvasCourseSectionWithCourseName[]
  settingsURL: string
  featureTitle: string
  resetFeature: () => void
}

export default function MultipleSectionEnrollmentWorkflow (props: MultipleSectionEnrollmentWorkflowProps): JSX.Element {
  const parser = new FileParserWrapper()
  const sectionIDs = props.sections.map(s => s.id)

  const classes = useStyles()
  const [workflowState, setWorkflowState] = useState<CSVWorkflowState>(CSVWorkflowState.Upload)
  const [file, setFile] = useState<File | undefined>(undefined)
  const [validEnrollments, setValidEnrollments] = useState<AddRowNumberedEnrollmentWithSectionID[] | undefined>(undefined)

  const [schemaInvalidations, setSchemaInvalidations] = useState<SchemaInvalidation[] | undefined>(undefined)
  const [rowInvalidations, setRowInvalidations] = useState<EnrollmentInvalidation[] | undefined>(undefined)

  const [doAddEnrollments, isAddEnrollmentsLoading, addEnrollmentsError] = usePromise(
    async (courseId: number, enrollments: AddEnrollmentWithSectionID[]) => {
      await api.addEnrollmentsToSections(courseId, enrollments.map(e => ({
        loginId: e.loginID, type: getCanvasRole(e.role), sectionId: e.sectionID
      })))
    },
    () => setWorkflowState(CSVWorkflowState.Confirmation)
  )

  const resetUpload = (): void => {
    setSchemaInvalidations(undefined)
    setRowInvalidations(undefined)
    setValidEnrollments(undefined)
    setWorkflowState(CSVWorkflowState.Upload)
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
        A section ID reference table (and a CSV version download) are available below.
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
      parser.parseCSV(
        file,
        handleValidation,
        (message) => setSchemaInvalidations([{ message, type: InvalidationType.Error }])
      )
    }

    const sectionDataToDownload = CSV_LINK_DOWNLOAD_PREFIX + encodeURIComponent(
      parser.createCSV<string[]>([
        ['SECTION_NAME', 'SECTION_ID'],
        ...props.sections.map(s => [s.name, String(s.id)])
      ])
    )

    const sectionIDsTable = (
      <TableContainer className={classes.sectionIDTable}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Section Name</TableCell>
              <TableCell>Section ID</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {
              props.sections.map((s, i) => (
                <TableRow key={i}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.id}</TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      </TableContainer>
    )

    return (
      <div>
        <div className={classes.spacing}>
          <ExampleFileDownloadHeader
            body={requirements}
            fileName='add_non_um_users_with_sections.csv'
            fileData={fileData}
          />
        </div>
        <Grid container className={classes.spacing}>
          <Grid item md={6} sm={9} xs={12}>
            <Link href={sectionDataToDownload} download='course_section_ids.csv'>
              Download a CSV with the Canvas Course Section IDs data
            </Link>
            <Accordion title='Course Section Canvas IDs' id='section-ids'>
              {sectionIDsTable}
            </Accordion>
          </Grid>
        </Grid>
        <FileUpload onUploadComplete={handleFile} />
        <div className={classes.buttonGroup}>
          <Button variant='outlined' aria-label='Back to select input method' onClick={props.resetFeature}>
            Back
          </Button>
        </div>
      </div>
    )
  }

  const renderReview = (enrollments: AddRowNumberedEnrollmentWithSectionID[]): JSX.Element => {
    if (addEnrollmentsError !== undefined) {
      return <BulkApiErrorContent error={addEnrollmentsError} tryAgain={resetUpload} />
    }

    const enrollmentData = enrollments.map(({ rowNumber, ...enrollmentData }) => enrollmentData)
    return (
      <div className={classes.container}>
        {file !== undefined && <CSVFileName file={file} />}
        <Grid container>
          <Box clone order={{ xs: 2, sm: 1 }}>
            <Grid item xs={12} sm={9} className={classes.confirmationTable}>
              <BulkEnrollUMUserToSectionsConfirmationTable enrollments={enrollments} />
            </Grid>
          </Box>
          <Box clone order={{ xs: 1, sm: 2 }}>
            <Grid item xs={12} sm={3}>
              <ConfirmDialog
                submit={async () => await doAddEnrollments(props.course.id, enrollmentData)}
                cancel={resetUpload}
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

  const renderConfirm = (): JSX.Element => {
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

  const renderWorkflowState = (state: CSVWorkflowState): JSX.Element => {
    switch (state) {
      case CSVWorkflowState.Upload:
        return renderUpload()
      case CSVWorkflowState.Review:
        if (validEnrollments === undefined) return <ErrorAlert />
        return renderReview(validEnrollments)
      case CSVWorkflowState.Confirmation:
        return renderConfirm()
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
