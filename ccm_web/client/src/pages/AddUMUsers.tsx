import { Backdrop, Button, CircularProgress, createStyles, Grid, makeStyles, Step, StepLabel, Stepper, Theme, Typography } from '@material-ui/core'
import React, { useEffect, useState } from 'react'
import { getCourseSections } from '../api'
import CreateSectionWidget from '../components/CreateSectionWidget'
import ExampleFileDownloadHeader, { ExampleFileDownloadHeaderProps } from '../components/ExampleFileDownloadHeader'
import FileUpload from '../components/FileUpload'
import SectionSelectorWidget from '../components/SectionSelectorWidget'
import usePromise from '../hooks/usePromise'
import { CanvasCourseSection } from '../models/canvas'
import { addUMUsersProps } from '../models/feature'
import { CCMComponentProps } from '../models/FeatureUIData'

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

      // position: 'relative',
      // zIndex: 0,
      // textAlign: 'center',
      // minHeight: '300px',
      // maxHeight: '400px'
    },
    stepper: {
      textAlign: 'center',
      paddingTop: '20px'
    },
    uploadContainer: {
      position: 'relative',
      zIndex: 0,
      textAlign: 'center'
    }
  })
)

interface AddUMUsersProps extends CCMComponentProps {}

function AddUMUsers (props: AddUMUsersProps): JSX.Element {
  const classes = useStyles()
  const [activeStep, setActiveStep] = useState(0)

  const [sections, setSections] = useState<CanvasCourseSection[]>([])

  const updateSections = (sections: CanvasCourseSection[]): void => {
    setSections(sections.sort((a, b) => { return a.name.localeCompare(b.name) }))
  }

  const [doLoadCanvasSectionData, isExistingSectionsLoading, getCanvasSectionDataError] = usePromise(
    async () => await getCourseSections(props.globals.course.id),
    (sections: CanvasCourseSection[]) => {
      updateSections(sections)
    }
  )

  useEffect(() => {
    void doLoadCanvasSectionData()
  }, [])

  const getSteps = (): string[] => {
    return ['Select', 'Upload', 'Review', 'Confirmation']
  }
  const steps = getSteps()

  const [selectedCourse, setSelectedCourse] = useState<CanvasCourseSection|undefined>(undefined)

  const sectionCreated = (newSection: CanvasCourseSection): void => {
    const newArray = sections.concat(newSection)
    console.log(newArray)
    updateSections(sections.concat(newSection))
  }

  const getSelectContent = (): JSX.Element => {
    return (
      <>
        <div className={classes.createSetctionWidget}><CreateSectionWidget {...props} onSectionCreated={sectionCreated}/></div>
        <Typography variant='subtitle1'>Or select one available section to add users</Typography>
        <div className={classes.sectionSelectionContainer}>
          <SectionSelectorWidget height={400} sections={sections !== undefined ? sections : []} selectionUpdated={setSelectedCourse}></SectionSelectorWidget>
          <div>
            <Button className={classes.sectionSelectButton} variant='contained' color='primary' disabled={selectedCourse === undefined} onClick={() => { setActiveStep(activeStep + 1) }}>Select</Button>
          </div>
          <Backdrop className={classes.backdrop} open={isExistingSectionsLoading}>
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
`uniqname1 StudentEnrollment
uniqname2 TeacherEnrollment`
    const fileDownloadHeaderProps: ExampleFileDownloadHeaderProps = {
      bodyText: "Your file should include the user's uniquname and their role",
      fileData: fileData,
      fileName: 'bulk_enroll.csv',
      linkText: 'Download an example',
      titleText: 'Upload your CSV File'
    }
    return (<ExampleFileDownloadHeader {...fileDownloadHeaderProps} />)
  }

  const uploadComplete = (): void => {

  }

  const renderFileUpload = (): JSX.Element => {
    return <div className={classes.uploadContainer}>
      <Grid container>
        <Grid item xs={12}>
          <FileUpload onUploadComplete={uploadComplete}></FileUpload>
        </Grid>
      </Grid>
      {/* <Backdrop className={classes.backdrop} open={isExistingSectionsLoading}>
        <Grid container>
          <Grid item xs={12}>
            <CircularProgress color="inherit" />
          </Grid>
          <Grid item xs={12}>
          {renderLoadingText()}
          </Grid>
        </Grid>
      </Backdrop> */}
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

  const getReviewContent = (): JSX.Element => {
    return (<div>Review</div>)
  }

  const getConfimationContent = (): JSX.Element => {
    return (<div>Confirmation</div>)
  }

  const getStepContent = (stepIndex: number): JSX.Element => {
    switch (stepIndex) {
      case 0:
        return getSelectContent()
      case 1:
        return getUploadContent()
      case 2:
        return getReviewContent()
      default:
        return getConfimationContent()
    }
  }

  const handleNext = (): void => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1)
  }

  const handleBack = (): void => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }

  const handleReset = (): void => {
    setActiveStep(0)
  }

  return (
    <>
      <div className={classes.root}>
        <Typography variant='h5'>{addUMUsersProps.title}</Typography>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <div>
          {activeStep === steps.length
            ? (
                <div>
                  <Typography className={classes.instructions}>All steps completed</Typography>
                  <Button onClick={handleReset}>Reset</Button>
                </div>
              )
            : (
                <div>
                  {getStepContent(activeStep)}
                  {/* <div className={classes.stepper}>
                    <Button
                      disabled={activeStep === 0}
                      onClick={handleBack}
                      className={classes.backButton}
                    >
                      Back
                    </Button>
                    <Button variant="contained" color="primary" onClick={handleNext}>
                      {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                    </Button>
                  </div> */}
                </div>
              )}
        </div>
      </div>
    </>
  )
}

export default AddUMUsers
