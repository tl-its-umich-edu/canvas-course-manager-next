import React, { useState } from 'react'
import { styled } from '@mui/material/styles'
import { Typography } from '@mui/material'

import * as api from '../api'
import ErrorAlert from '../components/ErrorAlert'
import Help from '../components/Help'
import MultipleUserEnrollmentWorkflow from '../components/MultipleUserEnrollmentWorkflow'
import UserEnrollmentForm from '../components/UserEnrollmentForm'
import MethodSelect from '../components/MethodSelect'
import usePromise from '../hooks/usePromise'
import {
  CanvasCourseSection, CanvasCourseSectionWithCourseName, getRolesUserCanEnroll, injectCourseName,
  sortSections
} from '../models/canvas'
import { CCMComponentProps } from '../models/FeatureUIData'

const PREFIX = 'AddNonUMUsers'

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

enum InputMethod {
  Single = 'single',
  CSV = 'csv'
}

enum PageState {
  SelectInputMethod,
  AddSingleUser,
  AddCSVUsers
}

interface AddNonUMUsersProps extends CCMComponentProps {}

export default function AddNonUMUsers (props: AddNonUMUsersProps): JSX.Element {
  const { course, canvasURL } = props.globals
  if (course.roles.length === 0) return <ErrorAlert />

  const settingsURL = `${canvasURL}/courses/${course.id}/settings`
  const rolesUserCanEnroll = getRolesUserCanEnroll(course.roles)

  const [activePageState, setActivePageState] = useState<PageState>(PageState.SelectInputMethod)
  const [inputMethod, setInputMethod] = useState<InputMethod>(InputMethod.Single)
  const [sections, setSections] = useState<CanvasCourseSectionWithCourseName[] | undefined>(undefined)

  const [doGetSections, isGetSectionsLoading, getSectionsError, clearGetSectionsError] = usePromise(
    async () => await api.getCourseSections(props.globals.course.id),
    (sections: CanvasCourseSection[]) => {
      setSections(sortSections(injectCourseName(sections, props.course.name)))
    }
  )

  const renderSelectInputMethod = (): JSX.Element => {
    return (
      <MethodSelect<InputMethod>
        label='Choose how you want to add users'
        options={[
          { key: InputMethod.Single, label: 'Add one user manually' },
          { key: InputMethod.CSV, label: 'Add multiple users by uploading a CSV' }
        ]}
        typeGuard={(v): v is InputMethod => v === InputMethod.CSV || v === InputMethod.Single}
        selectedMethod={inputMethod}
        setMethod={setInputMethod}
        onButtonClick={async () => {
          if (inputMethod === InputMethod.CSV) {
            setActivePageState(PageState.AddCSVUsers)
          } else {
            setActivePageState(PageState.AddSingleUser)
          }
          await doGetSections()
        }}
      />
    )
  }

  const resetFeature = (): void => {
    setSections(undefined)
    setActivePageState(PageState.SelectInputMethod)
  }

  const renderActivePageState = (state: PageState): JSX.Element => {
    const commonProps = {
      sections: sections ?? [],
      csrfToken: props.csrfToken,
      doGetSections: async () => {
        clearGetSectionsError()
        setSections(undefined)
        await doGetSections()
      },
      isGetSectionsLoading,
      getSectionsError,
      rolesUserCanEnroll,
      featureTitle: props.title,
      settingsURL,
      resetFeature
    }

    const onSectionCreated = (newSection: CanvasCourseSection): void => {
      if (sections !== undefined) {
        setSections(sortSections(sections.concat(injectCourseName([newSection], props.course.name))))
      }
    }

    switch (state) {
      case PageState.SelectInputMethod:
        return renderSelectInputMethod()
      case PageState.AddSingleUser:
        return <UserEnrollmentForm {...commonProps} />
      case PageState.AddCSVUsers:
        return (
          <MultipleUserEnrollmentWorkflow
            {...commonProps}
            course={props.course}
            onSectionCreated={onSectionCreated}
            userCourseRoles={props.globals.course.roles}
          />
        )
      default:
        return <ErrorAlert />
    }
  }

  return (
    <Root className={classes.root}>
      <Help baseHelpURL={props.globals.baseHelpURL} helpURLEnding={props.helpURLEnding} />
      <Typography variant='h5' component='h1' className={classes.spacing}>{props.title}</Typography>
      <div>{renderActivePageState(activePageState)}</div>
    </Root>
  )
}
