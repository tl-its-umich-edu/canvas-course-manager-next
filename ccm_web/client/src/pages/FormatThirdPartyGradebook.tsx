import React, { useEffect, useState } from 'react'
import { styled } from '@mui/material/styles'
import { Button, Backdrop, CircularProgress, Grid, Link, Typography } from '@mui/material'

import * as api from '../api.js'
import APIErrorMessage from '../components/APIErrorMessage.js'
import ConfirmDialog from '../components/ConfirmDialog.js'
import CSVFileName from '../components/CSVFileName.js'
import ErrorAlert from '../components/ErrorAlert.js'
import ExampleFileDownloadHeader from '../components/ExampleFileDownloadHeader.js'
import FileUpload from '../components/FileUpload.js'
import Help from '../components/Help.js'
import SectionSelectorWidget, { SelectableCanvasCourseSection } from '../components/SectionSelectorWidget.js'
import SuccessCard from '../components/SuccessCard.js'
import ThirdPartyGradebookConfirmationTable from '../components/ThirdPartyGradebookConfirmationTable.js'
import WarningAlert from '../components/WarningAlert.js'
import WorkflowStepper from '../components/WorkflowStepper.js'
import usePromise from '../hooks/usePromise.js'
import { CanvasCourseSection, injectCourseName } from '../models/canvas.js'
import { CCMComponentProps } from '../models/FeatureUIData.js'
import { APIErrorWithContext, CSVWorkflowStep, InvalidationType } from '../models/models.js'
import CSVSchemaValidator, { SchemaInvalidation } from '../utils/CSVSchemaValidator.js'
import FileParserWrapper, { CSVRecord } from '../utils/FileParserWrapper.js'
import ThirdPartyGradebookProcessor, {
  GradebookInvalidation, GradebookUploadRecord, isGradebookUploadRecord, POINTS_POS_TEXT,
  REQUIRED_LOGIN_ID_HEADER, REQUIRED_ORDERED_HEADERS
} from '../utils/ThirdPartyGradebookProcessor.js'
import { createOutputFileName, getRowNumber, prepDownloadDataString } from '../utils/fileUtils.js'

const PREFIX = 'FormatThirdPartyGradebook'

const classes = {
  root: `${PREFIX}-root`,
  buttonGroup: `${PREFIX}-buttonGroup`,
  stepper: `${PREFIX}-stepper`,
  table: `${PREFIX}-table`,
  selectContainer: `${PREFIX}-selectContainer`,
  uploadContainer: `${PREFIX}-uploadContainer`,
  reviewContainer: `${PREFIX}-reviewContainer`,
  reviewNotes: `${PREFIX}-reviewNotes`,
  backdrop: `${PREFIX}-backdrop`
}

const Root = styled('div')((
  {
    theme
  }
) => ({
  [`&.${classes.root}`]: {
    textAlign: 'left'
  },

  [`& .${classes.buttonGroup}`]: {
    marginTop: theme.spacing(1)
  },

  [`& .${classes.stepper}`]: {
    textAlign: 'center',
    paddingTop: '20px'
  },

  [`& .${classes.table}`]: {
    paddingLeft: 10,
    paddingRight: 10
  },

  [`& .${classes.selectContainer}`]: {
    position: 'relative',
    zIndex: 0,
    textAlign: 'center'
  },

  [`& .${classes.uploadContainer}`]: {
    textAlign: 'center'
  },

  [`& .${classes.reviewContainer}`]: {
    textAlign: 'center'
  },

  [`& .${classes.reviewNotes}`]: {
    textAlign: 'left'
  },

  [`& .${classes.backdrop}`]: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#FFF',
    position: 'absolute'
  }
}))

interface FormatThirdPartyGradebookProps extends CCMComponentProps {}

export default function FormatThirdPartyGradebook (props: FormatThirdPartyGradebookProps): JSX.Element {
  const csvParser = new FileParserWrapper(
    Object.assign({ ...FileParserWrapper.defaultParseConfigOptions }, { transformHeader: undefined })
  )

  const [activeStep, setActiveStep] = useState<CSVWorkflowStep>(CSVWorkflowStep.Select)
  const [sections, setSections] = useState<SelectableCanvasCourseSection[] | undefined>(undefined)
  const [selectedSections, setSelectedSections] = useState<SelectableCanvasCourseSection[] | undefined>(undefined)
  const [studentLoginIds, setStudentLoginIds] = useState<string[] | undefined>(undefined)
  const [file, setFile] = useState<File | undefined>(undefined)
  const [records, setRecords] = useState<GradebookUploadRecord[] | undefined>(undefined)
  const [processedRecords, setProcessedRecords] = useState<GradebookUploadRecord[] | undefined>(undefined)
  const [assignmentHeader, setAssignmentHeader] = useState<string | undefined>(undefined)

  const [schemaInvalidations, setSchemaInvalidations] = useState<SchemaInvalidation[] | undefined>(undefined)
  const [gradebookInvalidations, setGradebookInvalidations] = useState<GradebookInvalidation[] | undefined>(undefined)

  const [doGetSections, isGetSectionsLoading, getSectionsError, clearGetSectionsError] = usePromise(
    async () => await api.getCourseSections(props.globals.course.id),
    (sections: CanvasCourseSection[]) => setSections(injectCourseName(sections, props.course.name))
  )

  const [doGetStudents, isGetStudentsLoading, getStudentsError, clearGetStudentsError] = usePromise(
    async (sectionIds: number[]) => {
      const loginIds: string[] = []
      for (const sectionId of sectionIds) {
        loginIds.push(...(await api.getStudentsEnrolledInSection(sectionId)))
      }
      return [...(new Set(loginIds))] // Dropping duplicates
    },
    (studentLoginIds: string[]) => setStudentLoginIds(studentLoginIds)
  )

  useEffect(() => {
    void doGetSections()
  }, [])

  useEffect(() => {
    if (studentLoginIds !== undefined) {
      setActiveStep(CSVWorkflowStep.Upload)
    }
  }, [studentLoginIds])

  const handleSelectClick = async (): Promise<void> => {
    if (selectedSections !== undefined) {
      await doGetStudents(selectedSections.map(s => s.id))
    }
  }

  const handleSchemaValidation = (headers: string[] | undefined, rowData: CSVRecord[]): void => {
    const schemaValidator = new CSVSchemaValidator<GradebookUploadRecord>([REQUIRED_LOGIN_ID_HEADER], isGradebookUploadRecord)
    const validationResult = schemaValidator.validate(headers, rowData)
    if (!validationResult.valid) return setSchemaInvalidations(validationResult.schemaInvalidations)
    return setRecords(validationResult.validData)
  }

  const parseFile = (file: File): void => {
    csvParser.parseCSV(
      file,
      handleSchemaValidation,
      message => setSchemaInvalidations([{ message, type: InvalidationType.Error }])
    )
  }

  useEffect(() => {
    if (studentLoginIds !== undefined && records !== undefined) {
      const processor = new ThirdPartyGradebookProcessor(studentLoginIds)
      const result = processor.process(records)
      if (result.valid) {
        setProcessedRecords(result.processedRecords)
        setAssignmentHeader(result.assignmentHeader)
      }
      setGradebookInvalidations(result.invalidations)
      if (result.invalidations.length === 0) {
        setActiveStep(CSVWorkflowStep.Review)
      }
    }
  }, [records])

  const handleResetSelect = (): void => {
    setSections(undefined)
    clearGetSectionsError()
    setSelectedSections(undefined)
    setStudentLoginIds(undefined)
    clearGetStudentsError()
  }

  const handleResetUpload = (): void => {
    setFile(undefined)
    setRecords(undefined)
    setSchemaInvalidations(undefined)
    setProcessedRecords(undefined)
    setGradebookInvalidations(undefined)
  }

  const handleFullReset = async (): Promise<void> => {
    handleResetSelect()
    handleResetUpload()
    setActiveStep(CSVWorkflowStep.Select)
    await doGetSections()
  }

  const errorsWithContext = [
    { error: getSectionsError, context: 'loading section data' },
    { error: getStudentsError, context: 'loading student data' }
  ].filter(d => d.error !== undefined) as APIErrorWithContext[]

  const renderSchemaInvalidations = (invalidations: SchemaInvalidation[]): JSX.Element => {
    const messages = invalidations.map(
      (invalidation, i) => <Typography key={i}>{invalidation.message}</Typography>
    )
    return <ErrorAlert messages={messages} tryAgain={handleResetUpload} />
  }

  const renderGradebookInvalidations = (invalidations: GradebookInvalidation[]): JSX.Element => {
    const errors = invalidations.filter(i => i.type === InvalidationType.Error)
    const warnings = invalidations.filter(i => i.type === InvalidationType.Warning)

    if (errors.length > 0) {
      return (
        <ErrorAlert
          messages={errors.map((e, i) => <Typography key={i}>{e.message}</Typography>)}
          tryAgain={handleResetUpload}
        />
      )
    }
    if (warnings.length > 0) {
      return (
        <WarningAlert
          messages={warnings.map((w, i) => <Typography key={i}>{w.message}</Typography>)}
          cancel={handleResetUpload}
          cont={() => setActiveStep(CSVWorkflowStep.Review)}
        />
      )
    }
    return <ErrorAlert tryAgain={handleResetUpload} />
  }

  const renderSelect = (): JSX.Element => {
    if (errorsWithContext.length > 0) {
      return (
        <ErrorAlert
          messages={[<APIErrorMessage key={0} {...errorsWithContext[0]} />]}
          tryAgain={async () => {
            handleResetSelect()
            await doGetSections()
          }}
        />
      )
    }

    return (
      <div>
        <Typography align='left'>
          Select one or more sections whose students you want to collect grades from your CSV for.
        </Typography>
        <div className={classes.selectContainer}>
          <SectionSelectorWidget
            height={300}
            search={[]}
            multiSelect={true}
            sections={sections !== undefined ? sections : []}
            selectedSections={selectedSections !== undefined ? selectedSections : []}
            selectionUpdated={(sections) => {
              if (sections.length === 0) {
                setSelectedSections(undefined)
              } else {
                setSelectedSections(sections)
              }
            }}
            canUnmerge={false}
          />
          <Backdrop className={classes.backdrop} open={isGetSectionsLoading || isGetStudentsLoading}>
            <Grid container>
              <Grid item xs={12}>
                <CircularProgress color='inherit' />
              </Grid>
              <Grid item xs={12}>
                Loading
                {isGetSectionsLoading && ' section '}
                {isGetStudentsLoading && ' student '}
                data from Canvas
              </Grid>
            </Grid>
          </Backdrop>
        </div>
        <Grid container className={classes.buttonGroup} justifyContent='flex-end'>
          <Button
            color='primary'
            variant='contained'
            disabled={selectedSections === undefined}
            aria-label='Select section'
            onClick={handleSelectClick}
          >
            Select{selectedSections !== undefined ? ` (${selectedSections.length})` : ''}
          </Button>
        </Grid>
      </div>
    )
  }

  const renderUpload = (): JSX.Element => {
    if (schemaInvalidations !== undefined) {
      return renderSchemaInvalidations(schemaInvalidations)
    }
    if (gradebookInvalidations !== undefined) {
      return renderGradebookInvalidations(gradebookInvalidations)
    }

    const description = (
      'This tool creates a new version of the uploaded file so it only includes students in the selected sections ' +
      'and is formatted appropriately for uploading to Canvas.'
    )
    const gradeUploadDocsLink = 'https://community.canvaslms.com/t5/Instructor-Guide/tkb-p/Instructor#Grades'
    const requirements = (
      <ol>
        <li>
          <Typography>
            The file includes a &quot;{REQUIRED_LOGIN_ID_HEADER}&quot; column (the Canvas equivalent of Uniqname)
            and one other column of scores, with the column&apos;s header being the name of a new assignment.
            Other columns required by Canvas
            (see the <Link href={gradeUploadDocsLink} target='_blank' rel='noopener'>help docs</Link>)
            are allowed but not required.
          </Typography>
        </li>
        <li>
          <Typography>
            The first non-header row is a &quot;{POINTS_POS_TEXT}&quot; row, meaning that the value in the new
            assignment column will be the maximum points possible for that assignment
            and that &quot;{POINTS_POS_TEXT}&quot; is present in another cell in the row
            (such as the row&apos;s cell for &quot;{REQUIRED_LOGIN_ID_HEADER}&quot;).
          </Typography>
        </li>
        <li>
          <Typography>
            Your file must include records for at least one student in the selected sections
            (students are identified using the &quot;{REQUIRED_LOGIN_ID_HEADER}&quot; value).
          </Typography>
        </li>
      </ol>
    )
    const fileData = (
      `${REQUIRED_LOGIN_ID_HEADER},Example Assignment\n` +
      `${POINTS_POS_TEXT},100\n` +
      'studentone,80\n' +
      'studenttwo,90\n'
    )

    return (
      <div>
        <ExampleFileDownloadHeader
          description={description}
          body={requirements}
          fileName='third_party_gradebook.csv'
          fileData={fileData}
        />
        <div className={classes.uploadContainer}>
          <Grid container>
            <Grid item xs={12}>
              <FileUpload
                onUploadComplete={(file) => {
                  setFile(file)
                  parseFile(file)
                }}
              />
          </Grid>
          </Grid>
          <Grid container className={classes.buttonGroup} justifyContent='flex-start'>
            <Button
              variant='outlined'
              aria-label='Back to Select Section'
              onClick={async () => {
                handleResetSelect()
                setActiveStep(CSVWorkflowStep.Select)
                await doGetSections()
              }}
            >
              Back
            </Button>
          </Grid>
        </div>
      </div>
    )
  }

  const renderReview = (
    processedRecords: GradebookUploadRecord[], assignmentHeader: string, file: File
  ): JSX.Element => {
    const recordsToReview = processedRecords.map((r, i) => ({ rowNumber: getRowNumber(i), ...r }))
    const dataToDownload = prepDownloadDataString(
      csvParser.createCSV<GradebookUploadRecord>({
        fields: [...REQUIRED_ORDERED_HEADERS, assignmentHeader],
        data: processedRecords
      })
    )

    return (
      <div className={classes.reviewContainer}>
        <CSVFileName file={file} />
        <Grid container>
            <Grid item xs={12} sm={12} md={9} sx={{ order: { xs: 2, sm: 2, md: 1, lg: 1 } }} className={classes.table}>
              <Typography gutterBottom className={classes.reviewNotes}>
                Notes: The first row shown below is the &quot;{POINTS_POS_TEXT}&quot; row.
                In addition to the &quot;{REQUIRED_LOGIN_ID_HEADER}&quot; and assignment columns,
                the downloaded file will include other columns in a specific order
                to make it compatible with the Canvas upload process.
              </Typography>
              <ThirdPartyGradebookConfirmationTable records={recordsToReview} assignmentHeader={assignmentHeader} />
            </Grid>
            <Grid item xs={12} sm={12} md={3} sx={{ order: { xs: 1, sm: 1, md: 2, lg: 2 } }}>
              <ConfirmDialog
                message='Your file is valid! If this looks correct, click "Submit" to proceed with downloading.'
                submit={() => setActiveStep(CSVWorkflowStep.Confirmation)}
                cancel={() => {
                  handleResetUpload()
                  setActiveStep(CSVWorkflowStep.Upload)
                }}
                download={{
                  fileName: createOutputFileName(file.name),
                  data: dataToDownload
                }}
              />
            </Grid>
        </Grid>
      </div>
    )
  }

  const renderConfirmation = (): JSX.Element => {
    return (
      <div>
        <SuccessCard
          message={<Typography>The formatted gradebook file has been downloaded to your computer!</Typography>}
        />
        <Grid container className={classes.buttonGroup} justifyContent='flex-start'>
          <Button variant='outlined' aria-label={`Start ${props.title} again`} onClick={handleFullReset}>
            Start Again
          </Button>
        </Grid>
      </div>
    )
  }

  const renderStep = (step: CSVWorkflowStep): JSX.Element => {
    switch (step) {
      case CSVWorkflowStep.Select:
        return renderSelect()
      case CSVWorkflowStep.Upload:
        return renderUpload()
      case CSVWorkflowStep.Review:
        if (file !== undefined && processedRecords !== undefined && assignmentHeader !== undefined) {
          return renderReview(processedRecords, assignmentHeader, file)
        }
        return <ErrorAlert tryAgain={handleFullReset} />
      case CSVWorkflowStep.Confirmation:
        return renderConfirmation()
      default:
        return <ErrorAlert tryAgain={handleFullReset} />
    }
  }

  return (
    <Root className={classes.root}>
      <Help baseHelpURL={props.globals.baseHelpURL} helpURLEnding={props.helpURLEnding} />
      <Typography variant='h5' component='h1'>{props.title}</Typography>
      <WorkflowStepper allSteps={Object(CSVWorkflowStep)} activeStep={activeStep} />
      <div>{renderStep(activeStep)}</div>
    </Root>
  )
}
