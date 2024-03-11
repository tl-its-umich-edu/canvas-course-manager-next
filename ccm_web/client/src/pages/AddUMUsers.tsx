import React, { useState } from 'react'
import { styled } from '@mui/material/styles'
import { Typography } from '@mui/material'

import { getCourseSections } from '../api'
import Help from '../components/Help'
import MethodSelect from '../components/MethodSelect'
import MultipleSectionEnrollmentWorkflow from '../components/MultipleSectionEnrollmentWorkflow'
import SingleSectionEnrollmentWorkflow from '../components/SingleSectionEnrollmentWorkflow'
import usePromise from '../hooks/usePromise'
import {
  CanvasCourseSection, CanvasCourseSectionWithCourseName, injectCourseName, sortSections
} from '../models/canvas'
import { CCMComponentProps } from '../models/FeatureUIData'

const PREFIX = 'AddUMUsers'

const classes = {
  root: `${PREFIX}-root`,
  spacing: `${PREFIX}-spacing`
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
  }
}))

enum PageState {
  SelectInputMethod,
  CSVWorkflow
}

enum InputMethod {
  CSVSingleSection = 'single',
  CSVMultipleSections = 'multiple'
}

interface AddUMUsersProps extends CCMComponentProps {}

function AddUMUsers (props: AddUMUsersProps): JSX.Element {
  const { canvasURL, course } = props.globals
  const settingsURL = `${canvasURL}/courses/${course.id}/settings`

  const [pageState, setPageState] = useState<PageState>(PageState.SelectInputMethod)
  const [inputMethod, setInputMethod] = useState<InputMethod>(InputMethod.CSVSingleSection)

  const [sections, setSections] = useState<CanvasCourseSectionWithCourseName[] | undefined>(undefined)

  const [doGetSections, isGetSectionsLoading, getSectionsError, clearGetSectionsError] = usePromise(
    async () => await getCourseSections(props.globals.course.id),
    (sections: CanvasCourseSection[]) => {
      setSections(sortSections(injectCourseName(sections, props.course.name)))
    }
  )

  const resetFeature = (): void => {
    setSections(undefined)
    setPageState(PageState.SelectInputMethod)
  }

  const renderSelectInputMethod = (): JSX.Element => {
    return (
      <MethodSelect<InputMethod>
        label='Add U-M users through a CSV'
        options={[
          { key: InputMethod.CSVSingleSection, label: '1 section at a time' },
          { key: InputMethod.CSVMultipleSections, label: 'Using multiple sections' }
        ]}
        typeGuard={(v): v is InputMethod => {
          return v === InputMethod.CSVSingleSection || v === InputMethod.CSVMultipleSections
        }}
        selectedMethod={inputMethod}
        setMethod={setInputMethod}
        onButtonClick={async () => {
          setPageState(PageState.CSVWorkflow)
          await doGetSections()
        }}
      />
    )
  }

  const onSectionCreated = (newSection: CanvasCourseSection): void => {
    if (sections !== undefined) {
      setSections(sortSections(sections.concat(injectCourseName([newSection], props.course.name))))
    }
  }

  const commonProps = {
    course: props.course,
    sections: sections ?? [],
    doGetSections: async () => {
      clearGetSectionsError()
      setSections(undefined)
      await doGetSections()
    },
    isGetSectionsLoading,
    getSectionsError,
    featureTitle: props.title,
    settingsURL,
    resetFeature
  }

  return (
    <Root className={classes.root}>
      <Help baseHelpURL={props.globals.baseHelpURL} helpURLEnding={props.helpURLEnding} />
      <Typography variant='h5' component='h1' className={classes.spacing}>{props.title}</Typography>
      <div>
        {
          pageState === PageState.SelectInputMethod
            ? renderSelectInputMethod()
            : inputMethod === InputMethod.CSVSingleSection
              ? <SingleSectionEnrollmentWorkflow {...commonProps} onSectionCreated={onSectionCreated} />
              : <MultipleSectionEnrollmentWorkflow {...commonProps} />
        }
      </div>
    </Root>
  )
}

export default AddUMUsers
