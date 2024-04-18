import React, { useState } from 'react'
import { styled } from '@mui/material/styles'
import {
  Backdrop,
  Button,
  CircularProgress,
  Grid,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'

import Accordion from './Accordion.js'
import APIErrorMessage from './APIErrorMessage.js'
import BulkApiErrorContent from './BulkApiErrorContent.js'
import BulkEnrollUMUserToSectionsConfirmationTable from './BulkEnrollUMUserToSectionsConfirmationTable.js'
import ConfirmDialog from './ConfirmDialog.js'
import CSVFileName from './CSVFileName.js'
import ErrorAlert from './ErrorAlert.js'
import ExampleFileDownloadHeader from './ExampleFileDownloadHeader.js'
import FileUpload from './FileUpload.js'
import RowLevelErrorsContent from './RowLevelErrorsContent.js'
import SuccessCard from './SuccessCard.js'
import TableCaption from './TableCaption.js'
import ValidationErrorTable, { RowValidationError } from './ValidationErrorTable.js'
import * as api from '../api.js'
import usePromise from '../hooks/usePromise.js'
import { ClientEnrollmentType } from '../models/canvas.js'
import {
  AddEnrollmentWithSectionId, EnrollmentWithSectionIdRecord, isEnrollmentWithSectionIdRecord,
  MAX_ENROLLMENT_RECORDS, MAX_ENROLLMENT_MESSAGE, RowNumberedAddEnrollmentWithSectionId,
  REQUIRED_ENROLLMENT_WITH_SECTION_ID_HEADERS, SECTION_ID_TEXT, USER_ID_TEXT, USER_ROLE_TEXT
} from '../models/enrollment.js'
import { AddUMUsersLeafProps } from '../models/FeatureUIData.js'
import { CsrfToken, InvalidationType } from '../models/models.js'
import CSVSchemaValidator, { SchemaInvalidation } from '../utils/CSVSchemaValidator.js'
import {
  EnrollmentInvalidation, LoginIDRowsValidator, RoleRowsValidator, SectionIdRowsValidator
} from '../utils/enrollmentValidators.js'
import { getRowNumber, prepDownloadDataString } from '../utils/fileUtils.js'
import FileParserWrapper, { CSVRecord } from '../utils/FileParserWrapper.js'

const PREFIX = 'MultipleSectionEnrollmentWorkflow'

const classes = {
  spacing: `${PREFIX}-spacing`,
  buttonGroup: `${PREFIX}-buttonGroup`,
  sectionIdTable: `${PREFIX}-sectionIdTable`,
  confirmationTable: `${PREFIX}-confirmationTable`,
  container: `${PREFIX}-container`,
  backdrop: `${PREFIX}-backdrop`
}

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled('div')((
  {
    theme
  }
) => ({
  [`& .${classes.spacing}`]: {
    marginBottom: theme.spacing(2)
  },

  [`& .${classes.buttonGroup}`]: {
    marginTop: theme.spacing(1)
  },

  [`& .${classes.sectionIdTable}`]: {
    maxHeight: 300
  },

  [`& .${classes.confirmationTable}`]: {
    paddingRight: theme.spacing(1),
    paddingLeft: theme.spacing(1)
  },

  [`& .${classes.container}`]: {
    position: 'relative',
    zIndex: 0
  },

  [`& .${classes.backdrop}`]: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#FFF',
    position: 'absolute',
    textAlign: 'center'
  }
}))

enum CSVWorkflowState {
  Upload,
  Review,
  Confirmation
}

interface MultipleSectionEnrollmentWorkflowProps extends AddUMUsersLeafProps {
  csrfToken: CsrfToken
}

export default function MultipleSectionEnrollmentWorkflow (props: MultipleSectionEnrollmentWorkflowProps): JSX.Element {
  const parser = new FileParserWrapper()
  const sectionIds = props.sections.map(s => s.id)

  const [workflowState, setWorkflowState] = useState<CSVWorkflowState>(CSVWorkflowState.Upload)
  const [file, setFile] = useState<File | undefined>(undefined)
  const [validEnrollments, setValidEnrollments] = useState<RowNumberedAddEnrollmentWithSectionId[] | undefined>(undefined)

  const [schemaInvalidations, setSchemaInvalidations] = useState<SchemaInvalidation[] | undefined>(undefined)
  const [rowInvalidations, setRowInvalidations] = useState<EnrollmentInvalidation[] | undefined>(undefined)

  const [doAddEnrollments, isAddEnrollmentsLoading, addEnrollmentsError, clearAddEnrollmentsError] = usePromise(
    async (enrollments: AddEnrollmentWithSectionId[]) => {
      await api.addEnrollmentsToSections(
        enrollments.map(e => ({ loginId: e.loginId, role: e.role, sectionId: e.sectionId })),
        props.csrfToken.token
      )
    },
    () => setWorkflowState(CSVWorkflowState.Confirmation)
  )

  const getSectionsErrorAlert = (
    <ErrorAlert
      messages={[<APIErrorMessage key={0} context='loading section data' error={props.getSectionsError} />]}
      tryAgain={props.doGetSections}
    />
  )

  const resetUpload = async (): Promise<void> => {
    setSchemaInvalidations(undefined)
    setRowInvalidations(undefined)
    setValidEnrollments(undefined)
    clearAddEnrollmentsError()
    setWorkflowState(CSVWorkflowState.Upload)
    await props.doGetSections()
  }

  const handleValidation = (headers: string[] | undefined, rowData: CSVRecord[]): void => {
    const schemaValidator = new CSVSchemaValidator<EnrollmentWithSectionIdRecord>(
      REQUIRED_ENROLLMENT_WITH_SECTION_ID_HEADERS, isEnrollmentWithSectionIdRecord, MAX_ENROLLMENT_RECORDS
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
    const sectionIdValidator = new SectionIdRowsValidator(sectionIds)
    errors.push(...sectionIdValidator.validate(specifiedSectionIDs))

    if (errors.length > 0) return setRowInvalidations(errors)

    const enrollmentsWithSectionIds: RowNumberedAddEnrollmentWithSectionId[] = enrollmentRecords.map((r, i) => {
      return {
        rowNumber: getRowNumber(i),
        loginId: r.LOGIN_ID,
        role: r.ROLE as ClientEnrollmentType,
        sectionId: Number(r.SECTION_ID)
      }
    })
    setValidEnrollments(enrollmentsWithSectionIds)
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

  const renderRowValidationErrors = (errors: RowValidationError[]): JSX.Element => {
    return (
      (<>
        {file !== undefined && <CSVFileName file={file} />}
        <RowLevelErrorsContent
          table={<ValidationErrorTable invalidations={errors} />}
          title='Review your CSV file'
          resetUpload={resetUpload}
        />
      </>)
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
    if (props.getSectionsError !== undefined) return getSectionsErrorAlert

    if (schemaInvalidations !== undefined) return renderSchemaInvalidations(schemaInvalidations)
    if (rowInvalidations !== undefined) return renderRowValidationErrors(rowInvalidations)

    const requirements = (
      <Typography>
        Your file should include a {USER_ID_TEXT} (uniqname), a {USER_ROLE_TEXT}, and a {SECTION_ID_TEXT} for each user.
        A {SECTION_ID_TEXT} reference table (and a CSV version download) are available below. {MAX_ENROLLMENT_MESSAGE}
      </Typography>
    )

    const fileData =
      `${REQUIRED_ENROLLMENT_WITH_SECTION_ID_HEADERS.join(',')}\n` +
      'teacherone,teacher,1001\n'

    const sectionDataToDownload = prepDownloadDataString(
      parser.createCSV<string[]>([
        ['SECTION_NAME', 'SECTION_ID'],
        ...props.sections.map(s => [s.name, String(s.id)])
      ])
    )

    const tableCaption = `Names and Canvas IDs for the course's ${props.sections.length} sections`
    const sectionIdsTable = (
      <TableContainer className={classes.sectionIdTable}>
        <Table stickyHeader>
          <TableCaption text={tableCaption} />
          <TableHead>
            <TableRow>
              <TableCell>Section Name</TableCell>
              <TableCell>Section ID</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {
              props.sections.map((s, i) => (
                <TableRow tabIndex={0} key={i}>
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
            fileName='add_um_users_with_sections.csv'
            fileData={fileData}
          />
        </div>
        <Grid container className={`${classes.spacing} ${classes.container}`}>
          <Grid item md={6} sm={9} xs={12}>
            <Link href={sectionDataToDownload} download='course_section_ids.csv'>
              Download a CSV with the Canvas Course Section IDs data
            </Link>
            <Accordion title='Course Section Canvas IDs' id='section-ids'>{sectionIdsTable}</Accordion>
          </Grid>
          <Backdrop className={classes.backdrop} open={props.isGetSectionsLoading}>
            <Grid container>
              <Grid item xs={12}><CircularProgress color='inherit' /></Grid>
              <Grid item xs={12}>Loading section data from Canvas</Grid>
            </Grid>
          </Backdrop>
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

  const renderReview = (enrollments: RowNumberedAddEnrollmentWithSectionId[]): JSX.Element => {
    const enrollmentData = enrollments.map(({ rowNumber, ...enrollment }) => enrollment)
    return (
      <div className={classes.container}>
        {file !== undefined && <CSVFileName file={file} />}
        <Grid container>
            <Grid item xs={12} sm={9} sx={{ order: { xs: 2, sm: 1 } }} className={classes.confirmationTable}>
              <BulkEnrollUMUserToSectionsConfirmationTable enrollments={enrollments} />
            </Grid>
            <Grid item xs={12} sm={3} sx={{ order: { xs: 1, sm: 2 } }}>
              <ConfirmDialog
                submit={async () => await doAddEnrollments(enrollmentData)}
                cancel={resetUpload}
                disabled={isAddEnrollmentsLoading}
              />
            </Grid>
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

  const renderConfirm = (): JSX.Element => {
    const settingsLink = <Link href={props.settingsURL} target='_parent'>Canvas Settings page</Link>
    const message = <Typography>New users have been added to the section(s)!</Typography>
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
        if (addEnrollmentsError !== undefined) {
          return <BulkApiErrorContent error={addEnrollmentsError} file={file} tryAgain={resetUpload} />
        }
        if (validEnrollments !== undefined) return renderReview(validEnrollments)
        return <ErrorAlert />
      case CSVWorkflowState.Confirmation:
        return renderConfirm()
      default:
        return <ErrorAlert />
    }
  }

  return (
    <Root>
    <Typography variant='h6' component='h2'>Add Users to Multiple Sections</Typography>
    {renderWorkflowState(workflowState)}
    </Root>
  )
}
