import React, { useEffect, useState } from 'react'
import {
  Box, Button, Backdrop, CircularProgress, Grid, Link, makeStyles, Step, StepLabel, Stepper, Typography
} from '@material-ui/core'

import * as api from '../api'
import ConfirmDialog from '../components/ConfirmDialog'
import CSVFileName from '../components/CSVFileName'
import ErrorAlert from '../components/ErrorAlert'
import FileUpload from '../components/FileUpload'
import SectionSelectorWidget, { SelectableCanvasCourseSection } from '../components/SectionSelectorWidget'
import SuccessCard from '../components/SuccessCard'
import ThirdPartyGradebookConfirmationTable from '../components/ThirdPartyGradebookConfirmationTable'
import WarningAlert from '../components/WarningAlert'
import usePromise from '../hooks/usePromise'
import { CanvasCourseSection, injectCourseName } from '../models/canvas'
import { InvalidationType } from '../models/models'
import { CCMComponentProps } from '../models/FeatureUIData'
import CSVSchemaValidator, { SchemaInvalidation } from '../utils/CSVSchemaValidator'
import FileParserWrapper, { CSVRecord } from '../utils/FileParserWrapper'
import { createOutputFileName } from '../utils/fileUtils'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: 25,
    textAlign: 'left'
  },
  buttonGroup: {
    marginTop: theme.spacing(1)
  },
  backButton: {
    marginRight: theme.spacing(1)
  },
  stepper: {
    textAlign: 'center',
    paddingTop: '20px'
  },
  table: {
    paddingLeft: 10,
    paddingRight: 10
  },
  selectContainer: {
    position: 'relative',
    zIndex: 0,
    textAlign: 'center'
  },
  uploadContainer: {
    textAlign: 'center'
  },
  confirmContainer: {
    textAlign: 'center'
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#FFF',
    position: 'absolute'
  }
}))

interface GradebookUploadRecord extends CSVRecord {
  'Student Name': string
  'Student ID': string
  'SIS User ID': string
  'SIS Login ID': string
  'Section': string
}
const requiredHeaders = ['Student Name', 'Student ID', 'SIS User ID', 'SIS Login ID', 'Section']

interface ParsedRecordsResult {
  records: GradebookUploadRecord[]
  pointsPossibleRecord: GradebookUploadRecord
}

const isGradebookUploadRecord = (record: CSVRecord): record is GradebookUploadRecord => {
  return requiredHeaders.every(rh => typeof record[rh] === 'string')
}

interface FilteringInvalidation {
  message: string
  type: InvalidationType
}

interface StudentFilterResult {
  filteredRecords: GradebookUploadRecord[]
  filteringInvalidations: FilteringInvalidation[]
}

function handleFiltering (
  studentLoginIds: string[], uploadRecords: GradebookUploadRecord[]
): StudentFilterResult {
  const filteredRecords: GradebookUploadRecord[] = []
  const studentsWithoutRecords: string[] = []
  const filteringInvalidations: FilteringInvalidation[] = []

  for (const loginId of studentLoginIds) {
    const filterResult = uploadRecords.filter(r => r['SIS Login ID'] === loginId)
    if (filterResult.length === 1) {
      filteredRecords.push(filterResult[0])
    } else if (filterResult.length > 1) {
      filteringInvalidations.push({
        message: `Student with SIS Login ID ${loginId}`,
        type: InvalidationType.Error
      })
    } else {
      studentsWithoutRecords.push(loginId)
    }
  }
  if (studentsWithoutRecords.length > 0) {
    filteringInvalidations.push({
      message: (
        'One or more students from the section you selected were not present in the provided file: ' +
        studentsWithoutRecords.join(', ')
      ),
      type: InvalidationType.Warning
    })
  }
  if (filteredRecords.length === 0) {
    filteringInvalidations.push({
      message: 'None of the students from the section you selected were present in the provided file.',
      type: InvalidationType.Error
    })
  }
  return { filteredRecords, filteringInvalidations }
}

enum FormatGradebookStep {
  Select = 0,
  Upload = 1,
  Review = 2,
  Confirmation = 3
}

interface FormatThirdPartyGradebookProps extends CCMComponentProps {}

export default function FormatThirdPartyGradebook (props: FormatThirdPartyGradebookProps): JSX.Element {
  const classes = useStyles()

  const csvParser = new FileParserWrapper(
    Object.assign(FileParserWrapper.defaultParseConfigOptions, { transformHeader: undefined })
  )

  const [activeStep, setActiveStep] = useState<FormatGradebookStep>(FormatGradebookStep.Select)
  const [sections, setSections] = useState<SelectableCanvasCourseSection[] | undefined>(undefined)
  const [selectedSection, setSelectedSection] = useState<SelectableCanvasCourseSection | undefined>(undefined)
  const [studentLoginIds, setStudentLoginIds] = useState<string[] | undefined>(undefined)
  const [file, setFile] = useState<File | undefined>(undefined)
  const [recordsResult, setRecordsResult] = useState<ParsedRecordsResult | undefined>(undefined)
  const [filteredRecords, setFilteredRecords] = useState<GradebookUploadRecord[] | undefined>(undefined)

  const [schemaInvalidations, setSchemaInvalidations] = useState<SchemaInvalidation[] | undefined>(undefined)
  const [filteringInvalidations, setFilteringInvalidations] = useState<FilteringInvalidation[] | undefined>(undefined)

  const [doGetSections, isGetSectionsLoading, getSectionsError, clearGetSectionsError] = usePromise(
    async () => await api.getCourseSections(props.globals.course.id),
    (sections: CanvasCourseSection[]) => setSections(injectCourseName(sections, props.course.name))
  )

  const [doGetStudents, isGetStudentsLoading, getStudentsError, clearGetStudentsError] = usePromise(
    async (sectionId: number) => await api.getStudentsEnrolledInSection(sectionId),
    (studentLoginIds: string[]) => setStudentLoginIds(studentLoginIds)
  )

  useEffect(() => {
    if (getSectionsError === undefined) {
      void doGetSections()
    }
  }, [getSectionsError])

  const handleSchemaValidation = (headers: string[] | undefined, rowData: CSVRecord[]): void => {
    const schemaValidator = new CSVSchemaValidator<GradebookUploadRecord>(requiredHeaders, isGradebookUploadRecord)
    const validationResult = schemaValidator.validate(headers, rowData)
    if (!validationResult.valid) return setSchemaInvalidations(validationResult.schemaInvalidations)
    const records = validationResult.validData.slice(1)
    const pointsPossibleRecord = validationResult.validData[0]
    return setRecordsResult({ records, pointsPossibleRecord })
  }

  const parseFile = (file: File): void => {
    csvParser.parseCSV(
      file,
      handleSchemaValidation,
      message => setSchemaInvalidations([{ message, type: InvalidationType.Error }])
    )
  }

  useEffect(() => {
    if (file !== undefined) {
      parseFile(file)
    }
  }, [file])

  useEffect(() => {
    if (studentLoginIds !== undefined) {
      setActiveStep(FormatGradebookStep.Upload)
    }
  }, [studentLoginIds])

  const handleSelectClick = (): void => {
    if (selectedSection !== undefined) {
      void doGetStudents(selectedSection.id)
    }
  }

  useEffect(() => {
    if (studentLoginIds !== undefined && recordsResult !== undefined) {
      const result = handleFiltering(studentLoginIds, recordsResult.records)
      setFilteredRecords(result.filteredRecords)
      setFilteringInvalidations(result.filteringInvalidations)
      if (result.filteringInvalidations.length === 0) {
        setActiveStep(FormatGradebookStep.Review)
      }
    }
  }, [recordsResult])

  const handleResetSelect = (): void => {
    clearGetSectionsError()
    setSelectedSection(undefined)
    clearGetStudentsError()
  }

  const handleResetUpload = (): void => {
    setFile(undefined)
    clearGetStudentsError()
    setSchemaInvalidations(undefined)
    setFilteredRecords(undefined)
    setFilteringInvalidations(undefined)
  }

  const handleFullReset = (): void => {
    handleResetSelect()
    handleResetUpload()
    setActiveStep(FormatGradebookStep.Select)
  }

  const handleBack = (): void => setActiveStep((prevStep) => {
    if (prevStep > FormatGradebookStep.Select) return prevStep - 1
    return prevStep
  })

  const backButton = <Button className={classes.backButton} onClick={handleBack}>Back</Button>

  const renderSchemaInvalidations = (invalidations: SchemaInvalidation[]): JSX.Element => {
    const messages = invalidations.map(
      (invalidation, i) => <Typography key={i}>{invalidation.message}</Typography>
    )
    return <ErrorAlert messages={messages} tryAgain={handleResetUpload} />
  }

  const renderFilteringInvalidations = (invalidations: FilteringInvalidation[]): JSX.Element => {
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
          cont={() => setActiveStep(FormatGradebookStep.Review)}
        />
      )
    }
    return <ErrorAlert tryAgain={handleResetUpload} />
  }

  const renderSelect = (): JSX.Element => {
    if (getSectionsError !== undefined || getStudentsError !== undefined) {
      return (
        <ErrorAlert
          messages={[<Typography key={0}>An error occurred while loading section data from Canvas.</Typography>]}
          tryAgain={handleResetSelect}
        />
      )
    }

    return (
      <div>
        <Typography align='left'>Select one section you want to collect grades from your CSV for.</Typography>
        <div className={classes.selectContainer}>
          <SectionSelectorWidget
            height={300}
            search={[]}
            multiSelect={false}
            sections={sections !== undefined ? sections : []}
            selectedSections={selectedSection !== undefined ? [selectedSection] : []}
            selectionUpdated={(sections) => setSelectedSection(sections[0])}
            canUnmerge={false}
          />
          <Backdrop className={classes.backdrop} open={isGetSectionsLoading || isGetStudentsLoading}>
            <Grid container>
              <Grid item xs={12}>
                <CircularProgress color='inherit' />
              </Grid>
              <Grid item xs={12}>
                Loading section data from Canvas
              </Grid>
            </Grid>
          </Backdrop>
        </div>
        <Grid container className={classes.buttonGroup} justify='flex-end'>
          <Button
            color='primary'
            variant='contained'
            disabled={selectedSection === undefined}
            aria-label='Select section'
            onClick={handleSelectClick}
          >
            Select
          </Button>
        </Grid>
      </div>
    )
  }

  const renderUpload = (): JSX.Element => {
    if (schemaInvalidations !== undefined) {
      return renderSchemaInvalidations(schemaInvalidations)
    }
    if (filteringInvalidations !== undefined) {
      return renderFilteringInvalidations(filteringInvalidations)
    }

    const gradeUploadDocsLink = 'https://community.canvaslms.com/t5/Instructor-Guide/tkb-p/Instructor#Grades'
    return (
      <div>
        <Typography variant='h6' component='h2'>Upload your CSV File</Typography>
        <Typography gutterBottom>
          This tool creates a new version of the uploaded file so it only includes students in the selected section.
        </Typography>
        <Typography><strong>Requirements</strong></Typography>
        <ol>
          <li>
            <Typography>
              The file includes the necessary columns and a &quot;Points Possible&quot;
              row <Link href={gradeUploadDocsLink} target='_blank' rel='noopener'>as required by Canvas</Link>.
            </Typography>
            <Typography>
              The following headers are required (case sensitive): {requiredHeaders.map(rh => `"${rh}"`).join(', ')}
            </Typography>
          </li>
          <li>
            <Typography>
              Your file must include records for at least one student in the selected section
              (students are identified using the SIS Login ID value).
            </Typography>
          </li>
        </ol>
        <div className={classes.uploadContainer}>
          <Grid container>
            <Grid item xs={12}>
              <FileUpload onUploadComplete={(file) => setFile(file)} />
            </Grid>
          </Grid>
          <Grid container className={classes.buttonGroup} justify='flex-start'>
            {backButton}
          </Grid>
        </div>
      </div>
    )
  }

  const renderReview = (recordsResult: ParsedRecordsResult, filteredRecords: GradebookUploadRecord[], file: File): JSX.Element => {
    const recordsToReview = (filteredRecords).map((r, i) => ({
      rowNumber: i + 2,
      'Student Name': r['Student Name'],
      'SIS Login ID': r['SIS Login ID']
    }))

    const newData = [recordsResult.pointsPossibleRecord].concat(filteredRecords)
    const dataToDownload = 'data:text/csv;charset=utf-8,' + csvParser.createCSV(newData)

    return (
      <div className={classes.confirmContainer}>
        {file !== undefined && <CSVFileName file={file} />}
        <Grid container>
          <Box clone order={{ xs: 2, sm: 2, md: 1, lg: 1 }}>
            <Grid item xs={12} sm={12} md={9} className={classes.table}>
              <ThirdPartyGradebookConfirmationTable records={recordsToReview} />
            </Grid>
          </Box>
          <Box clone order={{ xs: 1, sm: 1, md: 2, lg: 2 }}>
            <Grid item xs={12} sm={12} md={3}>
              <ConfirmDialog
                message={
                  'Your file is valid! The table shows the students found and the new row numbers for their records.' +
                  'If this looks correct, click "Submit" to proceed with downloading.'
                }
                submit={() => setActiveStep(FormatGradebookStep.Confirmation)}
                cancel={() => {
                  handleResetUpload()
                  setActiveStep(FormatGradebookStep.Upload)
                }}
                download={{
                  fileName: createOutputFileName(file, '-puff'),
                  data: dataToDownload
                }}
              />
            </Grid>
          </Box>
        </Grid>
      </div>
    )
  }

  const renderConfirmation = (): JSX.Element => {
    return (
      <div>
        <SuccessCard
          message={<Typography>The trimmed gradebook file has been downloaded to your computer!</Typography>}
        />
        <Grid container className={classes.buttonGroup} justify='flex-start'>
          <Button variant='outlined' onClick={handleFullReset}>Start Again</Button>
        </Grid>
      </div>
    )
  }

  const renderStep = (step: FormatGradebookStep): JSX.Element => {
    switch (step) {
      case FormatGradebookStep.Select:
        return renderSelect()
      case FormatGradebookStep.Upload:
        return renderUpload()
      case FormatGradebookStep.Review:
        if (file !== undefined && recordsResult !== undefined && filteredRecords !== undefined) {
          return renderReview(recordsResult, filteredRecords, file)
        }
        return <ErrorAlert tryAgain={handleFullReset} />
      case FormatGradebookStep.Confirmation:
        return renderConfirmation()
      default:
        return <div>?</div>
    }
  }

  return (
    <div className={classes.root}>
      <Typography variant='h5' component='h1'>Convert a Third-Party Gradebook</Typography>
      <Stepper className={classes.stepper} activeStep={activeStep} alternativeLabel>
        {
          Object.entries(FormatGradebookStep)
            .filter(([key]) => isNaN(Number(key)))
            .map(([key, value]) => <Step key={value}><StepLabel>{key}</StepLabel></Step>)
        }
      </Stepper>
      <div>{renderStep(activeStep)}</div>
    </div>
  )
}
