import React, { useState } from 'react'
import { Grid, Typography } from '@material-ui/core'

import CreateSelectSectionWidget from './CreateSelectSectionWidget'
import ErrorAlert from './ErrorAlert'
import { SelectableCanvasCourseSection } from './SectionSelectorWidget'
import WorkflowStepper from './WorkflowStepper'
import { CanvasCourseBase, CanvasCourseSection } from '../models/canvas'

enum CSVWorkflowStep {
  Select,
  Upload,
  Review,
  Success
}

interface MultipleUserEnrollmentWorkflowProps {
  course: CanvasCourseBase
  sections: SelectableCanvasCourseSection[]
  onSectionCreated: (newSection: CanvasCourseSection) => void
}

export default function MultipleUserEnrollmentWorkflow (props: MultipleUserEnrollmentWorkflowProps): JSX.Element {
  const [activeStep, setActiveStep] = useState<CSVWorkflowStep>(CSVWorkflowStep.Select)
  const [selectedSection, setSelectedSection] = useState<SelectableCanvasCourseSection | undefined>(undefined)

  const renderActiveStep = (activeStep: CSVWorkflowStep): JSX.Element => {
    switch (activeStep) {
      case CSVWorkflowStep.Select:
        return (
          <CreateSelectSectionWidget
            {...props}
            selectedSection={selectedSection}
            setSelectedSection={setSelectedSection}
            onSelectClick={() => setActiveStep(CSVWorkflowStep.Upload)}
            disabled={selectedSection === undefined}
          />
        )
      default:
        return <ErrorAlert />
    }
  }

  return (
    <div>
      <Grid>
        <Typography variant='h6' component='h3'>Add Multiple Users Through CSV</Typography>
        <WorkflowStepper allSteps={Object(CSVWorkflowStep)} activeStep={activeStep} />
        <div>{renderActiveStep(activeStep)}</div>
      </Grid>
    </div>
  )
}
