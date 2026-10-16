import React, { useEffect } from 'react'
import { styled } from '@mui/material/styles'
import { Step, Stepper as MUIStepper, StepLabel } from '@mui/material'
import { announce } from '@react-aria/live-announcer'

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
  const steps = Object.entries(props.allSteps).filter(([key]) => isNaN(Number(key)))

  useEffect(() => {
    const activeLabel = steps.find(([, value]) => value === props.activeStep)?.[0]
    if (activeLabel === undefined) return
    announce(`Step ${props.activeStep + 1} of ${steps.length}: ${activeLabel}`, 'polite')
  }, [props.activeStep])

  return (
    <StyledMUIStepper className={classes.stepper} activeStep={props.activeStep} alternativeLabel>
    {
      steps.map(([key, value]) => <Step key={value}><StepLabel>{key}</StepLabel></Step>)
    }
    </StyledMUIStepper>
  )
}
