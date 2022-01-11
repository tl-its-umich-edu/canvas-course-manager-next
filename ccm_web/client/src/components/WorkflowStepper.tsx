import React from 'react'
import { makeStyles, Step, Stepper as MUIStepper, StepLabel } from '@material-ui/core'

const useStyles = makeStyles((theme) => ({
  stepper: {
    textAlign: 'center',
    paddingTop: theme.spacing(2)
  }
}))

interface StepperProps {
  allSteps: Record<string, number>
  activeStep: number
}

export default function WorkflowStepper (props: StepperProps): JSX.Element {
  const classes = useStyles()
  return (
    <MUIStepper className={classes.stepper} activeStep={props.activeStep} alternativeLabel>
    {
      Object.entries(props.allSteps)
        .filter(([key]) => isNaN(Number(key)))
        .map(([key, value]) => <Step key={value}><StepLabel>{key}</StepLabel></Step>)
    }
    </MUIStepper>
  )
}
