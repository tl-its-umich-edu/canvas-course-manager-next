import React from 'react'
import { styled } from '@mui/material/styles'
import { Step, Stepper as MUIStepper, StepLabel } from '@mui/material'

const PREFIX = 'WorkflowStepper'

const classes = {
  stepper: `${PREFIX}-stepper`
}

const StyledMUIStepper = styled(MUIStepper)((
  {
    theme
  }
) => ({
  [`&.${classes.stepper}`]: {
    textAlign: 'center',
    padding: 24,
    paddingTop: theme.spacing(2)
  }
}))

interface StepperProps {
  allSteps: Record<string, number>
  activeStep: number
}

export default function WorkflowStepper (props: StepperProps): JSX.Element {
  return (
    <StyledMUIStepper className={classes.stepper} activeStep={props.activeStep} alternativeLabel>
    {
      Object.entries(props.allSteps)
        .filter(([key]) => isNaN(Number(key)))
        .map(([key, value]) => <Step key={value}><StepLabel>{key}</StepLabel></Step>)
    }
    </StyledMUIStepper>
  )
}
