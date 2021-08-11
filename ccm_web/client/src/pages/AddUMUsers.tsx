import { Backdrop, Button, CircularProgress, createStyles, Grid, makeStyles, Step, StepLabel, Stepper, Theme, Typography } from '@material-ui/core'
import React, { useEffect, useState } from 'react'
import { getCourseSections } from '../api'
import CreateSectionWidget from '../components/CreateSectionWidget'
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
    sectionSelectionContainer: {
      position: 'relative',
      zIndex: 0,
      textAlign: 'center',
      minHeight: '300px',
      maxHeight: '400px'
    },
    stepper: {
      textAlign: 'center',
      paddingTop: '20px'
    }
  })
)

interface AddUMUsersProps extends CCMComponentProps {}

function AddUMUsers (props: AddUMUsersProps): JSX.Element {
  const classes = useStyles()
  const [activeStep, setActiveStep] = useState(0)

  const [sections, setSections] = useState<CanvasCourseSection[]|undefined>(undefined)

  const [doLoadCanvasSectionData, isExistingSectionsLoading, getCanvasSectionDataError] = usePromise(
    async () => await getCourseSections(props.globals.course.id),
    (value: CanvasCourseSection[]) => {
      setSections(value)
    }
  )

  useEffect(() => {
    void doLoadCanvasSectionData()
  }, [])

  const getSteps = (): string[] => {
    return ['Select', 'Upload', 'Review', 'Confirmation']
  }
  const steps = getSteps()

  const setSelectedCourse = (course: CanvasCourseSection|undefined): void => {
    console.log('Selected ' + course?.name)
  }

  const getSelectContent = (): JSX.Element => {
    return (
      <>
        <div className={classes.createSetctionWidget}><CreateSectionWidget {...props}/></div>
        <Typography variant='subtitle1'>Or select one available section to add users</Typography>
        <div className={classes.sectionSelectionContainer}>
          <SectionSelectorWidget height={400} sections={sections !== undefined ? sections : []} setSelectedCourse={setSelectedCourse}></SectionSelectorWidget>
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

  const getUploadContent = (): JSX.Element => {
    return (<div>Upload</div>)
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
                  <div className={classes.stepper}>
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
                  </div>
                </div>
              )}
        </div>
      </div>
    </>
  )
}

export default AddUMUsers
