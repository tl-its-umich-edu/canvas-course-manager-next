import { useEffect, useState, JSX } from 'react'
import { styled } from '@mui/material/styles'
import { Backdrop, Button, CircularProgress, Grid, Typography } from '@mui/material'

import { getCourseSections } from '../api.js'
import APIErrorMessage from '../components/APIErrorMessage.js'
import ErrorAlert from '../components/ErrorAlert.js'
import Help from '../components/Help.js'
import SectionSelectorWidget, { SelectableCanvasCourseSection } from '../components/SectionSelectorWidget.js'
import SelectedSectionInfo from '../components/SelectedSectionInfo.js'
import WorkflowStepper from '../components/WorkflowStepper.js'
import usePromise from '../hooks/usePromise.js'
import {
  CanvasCourseSection, CanvasCourseSectionWithCourseName, injectCourseName, sortSections
} from '../models/canvas.js'
import { CCMComponentProps } from '../models/FeatureUIData.js'
import { CSVWorkflowStep } from '../models/models.js'

const PREFIX = 'BulkUnenrollUsers'

const classes = {
  root: `${PREFIX}-root`,
  spacing: `${PREFIX}-spacing`,
  buttonGroup: `${PREFIX}-buttonGroup`,
  backdrop: `${PREFIX}-backdrop`,
  container: `${PREFIX}-container`
}

const Root = styled('div')((
  {
    theme
  }
) => ({
  [`&.${classes.root}`]: {
    textAlign: 'left'
  },

  [`& .${classes.spacing}`]: {
    marginBottom: theme.spacing(2)
  },

  [`& .${classes.buttonGroup}`]: {
    marginTop: theme.spacing(1)
  },

  [`& .${classes.backdrop}`]: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#FFF',
    position: 'absolute',
    textAlign: 'center'
  },

  [`& .${classes.container}`]: {
    position: 'relative',
    zIndex: 0
  }
}))

type BulkUnenrollUsersProps = CCMComponentProps

function BulkUnenrollUsers(props: BulkUnenrollUsersProps): JSX.Element {
  const [activeStep, setActiveStep] = useState<CSVWorkflowStep>(CSVWorkflowStep.Select)
  const [sections, setSections] = useState<SelectableCanvasCourseSection[] | undefined>(undefined)
  const [selectedSection, setSelectedSection] = useState<CanvasCourseSectionWithCourseName | undefined>(undefined)
  const [excludedCount, setExcludedCount] = useState(0)

  const [doGetSections, isGetSectionsLoading, getSectionsError, clearGetSectionsError] = usePromise(
    async () => await getCourseSections(props.globals.course.id),
    (sections: CanvasCourseSection[]) => {
      setExcludedCount(sections.filter(s => s.is_credit_section === true).length)
      setSections(sortSections(injectCourseName(
        sections.filter(s => s.is_credit_section === false),
        props.course.name
      ).map(section => ({ ...section, locked: section.total_students === 0 }))))
    }
  )

  useEffect(() => {
    void doGetSections()
  }, [])

  const retryGetSections = async (): Promise<void> => {
    clearGetSectionsError()
    setSections(undefined)
    setSelectedSection(undefined)
    setExcludedCount(0)
    await doGetSections()
  }

  const renderSelect = (): JSX.Element => {
    if (getSectionsError !== undefined) {
      return (
        <ErrorAlert
          messages={[<APIErrorMessage key={0} context='loading section data' error={getSectionsError} />]}
          tryAgain={retryGetSections}
        />
      )
    }

    return (
      <>
        <Typography variant='subtitle1' component='h3' className={classes.spacing}>
          Select the section to unenroll students from
        </Typography>
        <Typography variant='subtitle1' className={classes.spacing}>
          Only listing sections that are not official MPathways sections.
        </Typography>
        <div className={classes.container}>
          {!isGetSectionsLoading && sections !== undefined && sections.length === 0
            ? (
              <Typography variant='subtitle1' className={classes.spacing}>
                {excludedCount > 0
                  ? `${excludedCount} ${excludedCount === 1 ? 'section was' : 'sections were'} excluded. Bulk unenroll is NOT available for official MPathways sections.`
                  : 'No eligible sections were found. Sections with undetermined credit status are not listed.'}
              </Typography>
            )
            : (
              <SectionSelectorWidget
                height={300}
                search={[]}
                multiSelect={false}
                sections={sections ?? []}
                selectedSections={selectedSection !== undefined ? [selectedSection] : []}
                selectionUpdated={(sections) => setSelectedSection(sections[0])}
                canUnmerge={false}
              />
            )}
          <Backdrop className={classes.backdrop} open={isGetSectionsLoading}>
            <Grid container>
              <Grid size={12}><CircularProgress color='inherit' /></Grid>
              <Grid size={12}>Loading section data from Canvas</Grid>
            </Grid>
          </Backdrop>
        </div>
        <Grid container className={classes.buttonGroup} sx={{
          justifyContent: 'flex-end'
        }}>
          <Button
            variant='contained'
            color='primary'
            disabled={selectedSection === undefined}
            onClick={() => setActiveStep(CSVWorkflowStep.Upload)}
          >
            Select
          </Button>
        </Grid>
      </>
    )
  }

  // TODO: Build out remaining Bulk Unenroll Users steps (CSV upload, verify, and submit)
  const renderPlaceholder = (): JSX.Element => {
    return (
      <>
        {selectedSection !== undefined && <SelectedSectionInfo section={selectedSection} />}
        <Typography>This step is not yet available.</Typography>
        <Grid container className={classes.buttonGroup} sx={{
          justifyContent: 'flex-start'
        }}>
          <Button
            variant='outlined'
            aria-label='Back to Select Section'
            onClick={() => setActiveStep(CSVWorkflowStep.Select)}
          >
            Back
          </Button>
        </Grid>
      </>
    )
  }

  const getStepContent = (step: CSVWorkflowStep): JSX.Element => {
    switch (step) {
      case CSVWorkflowStep.Select:
        return renderSelect()
      case CSVWorkflowStep.Upload:
        return renderPlaceholder()
      default:
        return <ErrorAlert />
    }
  }

  return (
    <Root className={classes.root}>
      <Help baseHelpURL={props.globals.baseHelpURL} helpURLEnding={props.helpURLEnding} />
      <Typography variant='h5' component='h1' className={classes.spacing}>{props.title}</Typography>
      <WorkflowStepper allSteps={Object(CSVWorkflowStep)} activeStep={activeStep} />
      {getStepContent(activeStep)}
    </Root>
  )
}

export default BulkUnenrollUsers
