import {
  Backdrop, Box, Button, CircularProgress, createStyles, Grid, Link, makeStyles, Paper, Step, StepLabel,
  Stepper, Theme, Tooltip, Typography
} from '@material-ui/core'
import React, { useEffect, useState } from 'react'
import { CloudDone as CloudDoneIcon, HelpOutline as HelpIcon } from '@material-ui/icons'
import { useSnackbar } from 'notistack'

import { AddSectionEnrollment, addSectionEnrollments, getCourseSections } from '../api'
import APIErrorAlert from '../components/APIErrorAlert'
import BulkEnrollUMUserConfirmationTable, { IAddUMUserEnrollment } from '../components/BulkEnrollUMUserConfirmationTable'
import CanvasAPIErrorsTable from '../components/CanvasAPIErrorsTable'
import CreateSectionWidget from '../components/CreateSectionWidget'
import CSVFileName from '../components/CSVFileName'
import ExampleFileDownloadHeader, { ExampleFileDownloadHeaderProps } from '../components/ExampleFileDownloadHeader'
import FileUpload from '../components/FileUpload'
import RowLevelErrorsContent from '../components/RowLevelErrorsContent'
import SectionSelectorWidget from '../components/SectionSelectorWidget'
import SuccessCard from '../components/SuccessCard'
import usePromise from '../hooks/usePromise'
import { CanvasCourseSection, canvasRoles, getCanvasRole } from '../models/canvas'
import { addUMUsersProps } from '../models/feature'
import { CCMComponentProps } from '../models/FeatureUIData'
import ValidationErrorTable, { ValidationError } from '../components/ValidationErrorTable'
import { CanvasError } from '../utils/handleErrors'

const USER_ROLE_TEXT = 'Role'
const USER_ID_TEXT = 'Login ID'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      padding: 25,
      textAlign: 'left'
    },
    backButton: {
      marginRight: theme.spacing(1)
    },
    backdrop: {
      zIndex: theme.zIndex.drawer + 1,
      color: '#fff',
      position: 'absolute'
    },
    confirmContainer: {
      position: 'relative',
      zIndex: 0,
      textAlign: 'center'
    },
    instructions: {
      marginTop: theme.spacing(1),
      marginBottom: theme.spacing(1)
    },
    createSetctionWidget: {
      width: '500px'
    },
    sectionSelectButton: {
      float: 'right'
    },
    sectionSelectionContainer: {
      position: 'relative',
      zIndex: 0,
      textAlign: 'center',
      maxHeight: '400px'
    },
    stepper: {
      textAlign: 'center',
      paddingTop: '20px'
    },
    uploadContainer: {
      position: 'relative',
      zIndex: 0,
      textAlign: 'center'
    },
    dialog: {
      textAlign: 'center',
      marginBottom: 15,
      paddingLeft: 10,
      paddingRight: 10
    },
    table: {
      paddingLeft: 10,
      paddingRight: 10
    },
    dialogIcon: {
      color: '#3F648E'
    },
    newSectionHint: {
      display: 'flex'
    },
    createSectionContainer: {
      paddingBottom: '20px'
    }
  })
)

interface AddUMUsersProps extends CCMComponentProps {}

function AddUMUsers (props: AddUMUsersProps): JSX.Element {
  enum States {
    SelectSection = 0,
    UploadCSV = 1,
    ReviewCSV = 2,
    Confirmation = 3
  }

  const classes = useStyles()
  const { enqueueSnackbar } = useSnackbar()
  const [activeStep, setActiveStep] = useState(States.SelectSection)

  const [sections, setSections] = useState<CanvasCourseSection[]>([])
  const [selectedSection, setSelectedSection] = useState<CanvasCourseSection | undefined>(undefined)
  const [file, setFile] = useState<File|undefined>(undefined)
  const [enrollments, setEnrollments] = useState<IAddUMUserEnrollment[]|undefined>(undefined)
  const [errors, setErrors] = useState<ValidationError[]|undefined>(undefined)

  const updateSections = (sections: CanvasCourseSection[]): void => {
    setSections(sections.sort((a, b) => { return a.name.localeCompare(b.name) }))
  }

  const [doGetSections, isGetSectionsLoading, getSectionsError, clearGetSectionsError] = usePromise(
    async () => await getCourseSections(props.globals.course.id),
    (sections: CanvasCourseSection[]) => {
      updateSections(sections)
    }
  )

  const [doAddEnrollments, isAddEnrollmentsLoading, addEnrollmentsError, clearAddEnrollmentsError] = usePromise(
    async (section: CanvasCourseSection, enrollments: AddSectionEnrollment[]) => {
      await addSectionEnrollments(section.id, enrollments)
    },
    () => { setActiveStep(States.Confirmation) }
  )

  useEffect(() => {
    void doGetSections()
  }, [])

  useEffect(() => {
    if (file !== undefined) {
      parseFile(file)
    }
  }, [file])

  const getSteps = (): string[] => {
    return ['Select', 'Upload', 'Review', 'Confirmation']
  }
  const steps = getSteps()

  const sectionCreated = (newSection: CanvasCourseSection): void => {
    updateSections(sections.concat(newSection))
    setSelectedSection(newSection)
  }

  const isValidRole = (role: string): boolean => {
    return canvasRoles.map(canvasRole => { return canvasRole.clientName.localeCompare(role, 'en', { sensitivity: 'base' }) === 0 }).filter(value => { return value }).length > 0
  }

  const isValidLoginId = (loginId: string): boolean => {
    // return uniqname.match(UNIQNAME_REGEX) !== null
    // Don't apply any validation here, just pass anything through
    // Flag this function for deletion in 3.. 2.. 1...
    return true
  }

  const handleParseSuccess = (enrollments: IAddUMUserEnrollment[]): void => {
    setEnrollments(enrollments)
    setErrors(undefined)
    setActiveStep(States.ReviewCSV)
  }

  const handleParseFailure = (errors: ValidationError[]): void => {
    setEnrollments(undefined)
    setErrors(errors)
    setActiveStep(States.ReviewCSV)
  }

  const handleReset = (): void => {
    clearGetSectionsError()
    clearAddEnrollmentsError()
    setActiveStep(States.SelectSection)
  }

  const handleReupload = (): void => {
    clearAddEnrollmentsError()
    setActiveStep(States.UploadCSV)
  }

  const parseFile = (file: File): void => {
    file.text().then(t => {
      let lines = t.replace(/\r\n/, '\n').split(/\n/)
      // An empty file will resultin 1 line
      if (lines.length > 0 && lines[0].length === 0) {
        lines = lines.slice(1)
      }

      const headerParts = lines[0].split(',')
      if (headerParts.length !== 2) {
        handleParseFailure([{ rowNumber: 1, message: 'Invalid header.' }])
        return
      } else if (USER_ROLE_TEXT.localeCompare(headerParts[0], 'en', { sensitivity: 'base' }) !== 0 || USER_ID_TEXT.localeCompare(headerParts[1], 'en', { sensitivity: 'base' }) !== 0) {
        handleParseFailure([{ rowNumber: 1, message: 'Invalid header.' }])
        return
      }

      lines = lines.slice(1)

      const enrollments: IAddUMUserEnrollment[] = []
      const errors: ValidationError[] = []
      lines.forEach((line, i) => {
        const parts = line.split(',')
        if (parts.length !== 2) {
          errors.push({ rowNumber: i + 2, message: 'Invalid column count' })
        } else {
          if (!isValidRole(parts[0])) {
            errors.push({ rowNumber: i + 2, message: `Invalid ${USER_ROLE_TEXT.toUpperCase()} '${parts[0]}'` })
          } else if (!isValidLoginId(parts[1])) {
            errors.push({ rowNumber: i + 2, message: `Invalid ${USER_ID_TEXT.toUpperCase()} '${parts[1]}'` })
          } else {
            enrollments.push({ rowNumber: i + 2, loginId: parts[1].trim(), role: parts[0].trim() })
          }
        }
      })

      if (errors.length === 0) {
        handleParseSuccess(enrollments)
      } else {
        handleParseFailure(errors)
      }
    }).catch(e => {
      // TODO Not sure how to produce this error in real life
      enqueueSnackbar('Error parsing file', {
        variant: 'error'
      })
    })
  }

  const getSelectContent = (): JSX.Element => {
    if (getSectionsError !== undefined) {
      return (
        <APIErrorAlert
          message={<Typography>An error occurred while loading section data from Canvas.</Typography>}
          tryAgain={handleReset}
        />
      )
    }

    return (
      <>
        <div className={classes.createSectionContainer}>
          <div className={classes.newSectionHint}><Typography>Create a new section to add users</Typography><Tooltip placement='top' title='Enter a distinct name for this section'><HelpIcon fontSize='small'/></Tooltip></div>
          <div className={classes.createSetctionWidget}><CreateSectionWidget {...props} onSectionCreated={sectionCreated}/></div>
        </div>
        <Typography variant='subtitle1'>Or select one available section to add users</Typography>
        <div className={classes.sectionSelectionContainer}>
          <SectionSelectorWidget
            height={400}
            multiSelect={false}
            sections={sections !== undefined ? sections : []}
            selectedSections={selectedSection !== undefined ? [selectedSection] : []}
            selectionUpdated={(sections) => setSelectedSection(sections[0])}
          />
          <div>
            <Button
              className={classes.sectionSelectButton}
              variant='contained'
              color='primary'
              disabled={selectedSection === undefined}
              onClick={() => { setActiveStep(activeStep + 1) }}
            >
              Select
            </Button>
          </div>
          <Backdrop className={classes.backdrop} open={isGetSectionsLoading}>
            <Grid container>
              <Grid item xs={12}>
                <CircularProgress color="inherit" />
              </Grid>
              <Grid item xs={12}>
                Loading sections
              </Grid>
            </Grid>
          </Backdrop>
        </div>
      </>
    )
  }

  const renderUploadHeader = (): JSX.Element => {
    const fileData =
`${USER_ROLE_TEXT.toUpperCase()},${USER_ID_TEXT.toUpperCase()}
student,studenta
teacher,usera
ta,userb
observer,userc
designer,userd`
    const fileDownloadHeaderProps: ExampleFileDownloadHeaderProps = {
      bodyText: `Your file should include the user's ${USER_ID_TEXT.toLocaleLowerCase()} and their ${USER_ROLE_TEXT.toLocaleLowerCase()}`,
      fileData: fileData,
      fileName: 'bulk_um_enroll.csv',
      linkText: 'Download an example',
      titleText: 'Upload your CSV File'
    }
    return (<ExampleFileDownloadHeader {...fileDownloadHeaderProps} />)
  }

  const uploadComplete = (file: File): void => {
    setFile(file)
  }

  const renderFileUpload = (): JSX.Element => {
    return <div className={classes.uploadContainer}>
      <Grid container>
        <Grid item xs={12}>
          <FileUpload onUploadComplete={uploadComplete}></FileUpload>
        </Grid>
      </Grid>
    </div>
  }

  const getUploadContent = (): JSX.Element => {
    return (
    <div>
      {renderUploadHeader()}
      <br/>
      {renderFileUpload()}
    </div>
    )
  }

  const renderConfirm = (section: CanvasCourseSection, enrollments: IAddUMUserEnrollment[]): JSX.Element => {
    const addSectionEnrollments = enrollments.map(e => ({ loginId: e.loginId, type: getCanvasRole(e.role) }))

    return (
      <div className={classes.confirmContainer}>
        {file !== undefined && <CSVFileName file={file} />}
        <Grid container>
          <Box clone order={{ xs: 2, sm: 1 }}>
            <Grid item xs={12} sm={9} className={classes.table}>
              <BulkEnrollUMUserConfirmationTable enrollments={enrollments} />
            </Grid>
          </Box>
          <Box clone order={{ xs: 1, sm: 2 }}>
            <Grid item xs={12} sm={3} className={classes.dialog}>
              <Paper role='status'>
                <Typography>Review your CSV file</Typography>
                <CloudDoneIcon className={classes.dialogIcon} fontSize='large'/>
                <Typography>Your file is valid!  If this looks correct, click &quot;Submit&quot; to proceed.</Typography>
                <Button variant="outlined" onClick={setStateUpload}>Cancel</Button>
                <Button
                  variant='outlined'
                  onClick={async () => await doAddEnrollments(section, addSectionEnrollments)}
                >
                  Submit
                </Button>
              </Paper>
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
        </Grid>
      </Backdrop>
      </div>
    )
  }

  const renderPostError = (error: Error): JSX.Element => {
    const apiErrorMessage = (
      <Typography>The last action failed with the following message: {error.message}</Typography>
    )
    return (
      error instanceof CanvasError
        ? (
            <>
            {file !== undefined && <CSVFileName file={file} />}
            <RowLevelErrorsContent
              table={<CanvasAPIErrorsTable errors={error.errors} />}
              title='Some errors occurred'
              errorType='error'
              resetUpload={handleReupload}
            />
            </>
          )
        : <APIErrorAlert message={apiErrorMessage} tryAgain={handleReset} />
    )
  }

  const getReviewContent = (): JSX.Element => {
    if (errors !== undefined) {
      return (renderValidationErrors(errors))
    } else if (addEnrollmentsError !== undefined) {
      return renderPostError(addEnrollmentsError)
    } else if (selectedSection !== undefined && enrollments !== undefined) {
      return renderConfirm(selectedSection, enrollments)
    } else {
      return (<div>?</div>)
    }
  }

  const getSuccessContent = (): JSX.Element => {
    const { canvasURL, course } = props.globals
    const settingsURL = `${canvasURL}/courses/${course.id}/settings`
    const message = <Typography>New users have been added to the section!</Typography>
    const nextAction = (
      <span>
        See the users in the course&apos;s sections on the <Link href={settingsURL} target='_parent'>Canvas Settings page</Link>for your course.
      </span>
    )
    return <SuccessCard {...{ message, nextAction }} />
  }

  const setStateUpload = (): void => {
    setEnrollments(undefined)
    setErrors(undefined)
    setActiveStep(States.UploadCSV)
  }

  const renderValidationErrors = (errors: ValidationError[]): JSX.Element => {
    return (
      <>
      {file !== undefined && <CSVFileName file={file} />}
      <RowLevelErrorsContent
        table={<ValidationErrorTable invalidations={errors} />}
        title='Review your CSV file'
        errorType='error'
        resetUpload={setStateUpload}
      />
      </>
    )
  }

  const getShouldNotHappenContent = (): JSX.Element => {
    return (<div>Unexpected step</div>)
  }

  const getStepContent = (stepIndex: number): JSX.Element => {
    switch (stepIndex) {
      case States.SelectSection:
        return getSelectContent()
      case States.UploadCSV:
        return getUploadContent()
      case States.ReviewCSV:
        return getReviewContent()
      case States.Confirmation:
        return getSuccessContent()
      default:
        return getShouldNotHappenContent()
    }
  }

  return (
    <div className={classes.root}>
      <Typography variant='h5'>{addUMUsersProps.title}</Typography>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <div>{getStepContent(activeStep)}</div>
    </div>
  )
}

export default AddUMUsers
