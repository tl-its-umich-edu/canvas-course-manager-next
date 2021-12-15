import React, { useEffect, useState } from 'react'
import {
  Backdrop, CircularProgress, Grid, makeStyles, Typography
} from '@material-ui/core'

import * as api from '../api'
import ErrorAlert from '../components/ErrorAlert'
import Help from '../components/Help'
import MultipleUserEnrollmentWorkflow from '../components/MultipleUserEnrollmentWorkflow'
import { SelectableCanvasCourseSection } from '../components/SectionSelectorWidget'
import UserEnrollmentForm from '../components/UserEnrollmentForm'
import UserMethodSelect from '../components/UserMethodSelect'
import usePromise from '../hooks/usePromise'
import { AllCanvasRoleData, CanvasCourseSection, ClientEnrollmentType, injectCourseName, sortSections } from '../models/canvas'
import { CCMComponentProps } from '../models/FeatureUIData'
import { RoleEnum } from '../models/models'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: 25,
    textAlign: 'left'
  },
  spacing: {
    marginTop: theme.spacing(1)
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

type InputMethod = 'single' | 'csv'

enum PageState {
  SelectInputMethod,
  AddSingleUser,
  AddCSVUsers
}

interface AddNonUMUsersProps extends CCMComponentProps {}

export default function AddNonUMUsers (props: AddNonUMUsersProps): JSX.Element {
  const classes = useStyles()

  const { roles } = props.globals.course
  console.log('Roles: ' + roles.toString())
  if (roles.length === 0) return <ErrorAlert />

  const mostPrivRole = roles.sort(
    (a, b) => AllCanvasRoleData[a].rank > AllCanvasRoleData[b].rank ? -1 : 1
  )[0]
  const mostPrivRoleData = AllCanvasRoleData[mostPrivRole]
  console.log('Most privileged role: ' + mostPrivRole)
  const rolesUserCanAdd: ClientEnrollmentType[] = []
  for (const role of Object.keys(AllCanvasRoleData)) {
    const roleData = AllCanvasRoleData[role as RoleEnum]
    if (roleData.addable && roleData.rank < mostPrivRoleData.rank) {
      rolesUserCanAdd.push(roleData.clientName)
    }
  }
  console.log('Roles use can add: ' + rolesUserCanAdd.toString())

  const [activePageState, setActivePageState] = useState<PageState>(PageState.SelectInputMethod)
  const [inputMethod, setInputMethod] = useState<InputMethod>('single')
  const [sections, setSections] = useState<SelectableCanvasCourseSection[] | undefined>(undefined)

  const [doGetSections, isGetSectionsLoading, getSectionsError, clearGetSectionsError] = usePromise(
    async () => await api.getCourseSections(props.globals.course.id),
    (sections: CanvasCourseSection[]) => setSections(injectCourseName(sections, props.course.name))
  )

  useEffect(() => {
    if (sections === undefined) {
      void doGetSections()
    }
  }, [sections, getSectionsError])

  const getSectionsErrorAlert = (
    <ErrorAlert
      messages={
        [<Typography key={0}>An error occurred while loading section data from Canvas</Typography>]
      }
      tryAgain={clearGetSectionsError}
    />
  )

  const renderSelectInputMethod = (): JSX.Element => {
    return (
      <UserMethodSelect
        selectedInputMethod={inputMethod}
        setInputMethod={setInputMethod}
        onButtonClick={() => {
          if (inputMethod === 'csv') {
            setActivePageState(PageState.AddCSVUsers)
          } else {
            setActivePageState(PageState.AddSingleUser)
          }
        }}
      />
    )
  }

  const renderAddSingleUser = (): JSX.Element => {
    return (
      <>
      <Typography variant='h6' component='h2' gutterBottom>Add Single User Manually</Typography>
      <UserEnrollmentForm
        sections={sections ?? []}
        rolesUserCanAdd={rolesUserCanAdd}
        enrollExistingUser={async () => undefined}
        enrollNewUser={async () => undefined}
        resetFeature={() => setActivePageState(PageState.SelectInputMethod)}
      />
      </>
    )
  }

  const renderActivePageState = (state: PageState): JSX.Element => {
    switch (state) {
      case PageState.SelectInputMethod:
        return renderSelectInputMethod()
      case PageState.AddSingleUser:
        return renderAddSingleUser()
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
            rolesUserCanAdd={rolesUserCanAdd}
            resetFeature={() => setActivePageState(PageState.SelectInputMethod)}
          />
        )
      default:
        return <ErrorAlert />
    }
  }

  return (
    <div className={classes.root}>
      <Help baseHelpURL={props.globals.baseHelpURL} helpURLEnding={props.helpURLEnding} />
      <Typography variant='h5' component='h1' gutterBottom>{props.title}</Typography>
      {
        getSectionsError !== undefined
          ? getSectionsErrorAlert
          : (
              <div className={classes.container}>
                {renderActivePageState(activePageState)}
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
    </div>
  )
}
