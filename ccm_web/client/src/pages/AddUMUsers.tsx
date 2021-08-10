import { Button, createStyles, makeStyles, Step, StepLabel, Stepper, Theme, Typography } from '@material-ui/core'
import React, { useState } from 'react'
import CreateSectionWidget from '../components/CreateSectionWidget'
import { addUMUsersProps } from '../models/feature'
import { CCMComponentProps } from '../models/FeatureUIData'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      padding: 25,
      textAlign: 'left'
    },
    backButton: {
      marginRight: theme.spacing(1)
    },
    instructions: {
      marginTop: theme.spacing(1),
      marginBottom: theme.spacing(1)
    },
    createSetctionWidget: {
      width: '500px'
    },
    stepper: {
      textAlign: 'center'
    }
  })
)

interface AddUMUsersProps extends CCMComponentProps {}

function AddUMUsers (props: AddUMUsersProps): JSX.Element {
  const classes = useStyles()
  const [activeStep, setActiveStep] = useState(0)

  const getSteps = (): string[] => {
    return ['Select', 'Upload', 'Review', 'Confirmation']
  }
  const steps = getSteps()

  const getSelectContent = (): JSX.Element => {
    return (
      <>
        <div className={classes.createSetctionWidget}><CreateSectionWidget {...props}/></div>
        <Typography variant='subtitle1'>Or select one available section to add users</Typography>
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
