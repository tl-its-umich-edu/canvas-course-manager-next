import React, { useEffect, useState } from 'react'
import { Backdrop, CircularProgress, Grid, makeStyles, Typography } from '@material-ui/core'

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

const useStyles = makeStyles((theme) => ({
  root: {
    padding: 25,
    textAlign: 'left'
  },
  spacing: {
    marginBottom: theme.spacing(2)
  },
  container: {
    position: 'relative',
    zIndex: 0
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#FFF',
    position: 'absolute',
    textAlign: 'center'
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
  const classes = useStyles()

  const { course, canvasURL } = props.globals
  if (course.roles.length === 0) return <ErrorAlert />

  const settingsURL = `${canvasURL}/courses/${course.id}/settings`
  const rolesUserCanEnroll = getRolesUserCanEnroll(course.roles)

  const [activePageState, setActivePageState] = useState<PageState>(PageState.SelectInputMethod)
  const [inputMethod, setInputMethod] = useState<InputMethod>(InputMethod.Single)
  const [sections, setSections] = useState<CanvasCourseSectionWithCourseName[] | undefined>(undefined)

  const [doGetSections, isGetSectionsLoading, getSectionsError, clearGetSectionsError] = usePromise(
    async () => await api.getCourseSections(props.globals.course.id),
    (sections: CanvasCourseSection[]) => setSections(injectCourseName(sections, props.course.name))
  )

  useEffect(() => {
    if (sections === undefined && getSectionsError === undefined) {
      void doGetSections()
    }
  }, [sections, getSectionsError])

  const getSectionsErrorAlert = (
    <ErrorAlert
      messages={
        [<Typography key={0}>An error occurred while loading section data from Canvas.</Typography>]
      }
      tryAgain={clearGetSectionsError}
    />
  )

  const renderSelectInputMethod = (): JSX.Element => {
    if (getSectionsError !== undefined) return getSectionsErrorAlert

    return (
      <div className={classes.container}>
        <MethodSelect<InputMethod>
          label='Choose how you want to add users'
          options={[
            { key: InputMethod.Single, label: 'Add one user manually' },
            { key: InputMethod.CSV, label: 'Add multiple users by uploading a CSV' }
          ]}
          typeGuard={(v): v is InputMethod => v === InputMethod.CSV || v === InputMethod.Single}
          selectedMethod={inputMethod}
          setMethod={setInputMethod}
          disabled={isGetSectionsLoading}
          onButtonClick={() => {
            if (inputMethod === InputMethod.CSV) {
              setActivePageState(PageState.AddCSVUsers)
            } else {
              setActivePageState(PageState.AddSingleUser)
            }
          }}
        />
        <Backdrop className={classes.backdrop} open={isGetSectionsLoading}>
          <Grid container>
            <Grid item xs={12}>
              <CircularProgress color='inherit' />
            </Grid>
            <Grid item xs={12}>
              Loading section data from Canvas
            </Grid>
          </Grid>
        </Backdrop>
      </div>
    )
  }

  const resetFeature = (): void => setActivePageState(PageState.SelectInputMethod)

  const renderActivePageState = (state: PageState): JSX.Element => {
    switch (state) {
      case PageState.SelectInputMethod:
        return renderSelectInputMethod()
      case PageState.AddSingleUser:
        return (
          <UserEnrollmentForm
            sections={sections ?? []}
            rolesUserCanEnroll={rolesUserCanEnroll}
            resetFeature={resetFeature}
            settingsURL={settingsURL}
          />
        )
      case PageState.AddCSVUsers:
        return (
          <MultipleUserEnrollmentWorkflow
            course={props.course}
            sections={sections ?? []}
            onSectionCreated={
              (newSection) => {
                if (sections !== undefined) {
                  setSections(
                    sortSections(sections.concat(injectCourseName([newSection], props.course.name)))
                  )
                }
              }
            }
            rolesUserCanEnroll={rolesUserCanEnroll}
            resetFeature={resetFeature}
            settingsURL={settingsURL}
          />
        )
      default:
        return <ErrorAlert />
    }
  }

  return (
    <div className={classes.root} aria-live='polite'>
      <Help baseHelpURL={props.globals.baseHelpURL} helpURLEnding={props.helpURLEnding} />
      <Typography variant='h5' component='h1' className={classes.spacing}>{props.title}</Typography>
      {renderActivePageState(activePageState)}
    </div>
  )
}
