import React, { useEffect, useState } from 'react'
import {
  Button, Backdrop, CircularProgress, Grid, makeStyles, Typography
} from '@material-ui/core'

import * as api from '../api'
import ErrorAlert from '../components/ErrorAlert'
import Help from '../components/Help'
import SectionSelectorWidget, { SelectableCanvasCourseSection } from '../components/SectionSelectorWidget'
import UserEnrollmentForm from '../components/UserEnrollmentForm'
import usePromise from '../hooks/usePromise'
import { AllCanvasRoleData, CanvasCourseSection, ClientEnrollmentType, injectCourseName } from '../models/canvas'
import { CCMComponentProps } from '../models/FeatureUIData'
import UserMethodSelect from '../components/UserMethodSelect'
import { RoleEnum } from '../models/models'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: 25,
    textAlign: 'left'
  },
  spacing: {
    marginTop: theme.spacing(1)
  },
  selectContainer: {
    position: 'relative',
    zIndex: 0,
    textAlign: 'center'
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#FFF',
    position: 'absolute'
  }
}))

type InputMethod = 'single' | 'csv'

enum PageState {
  SelectSection,
  SelectInputMethod,
  AddSingleUser,
  Success
//  CSVUserAdd,
//   CSVUpload,
//   CSVReview,
}

interface AddNonUMUsersProps extends CCMComponentProps {}

export default function AddNonUMUsers (props: AddNonUMUsersProps): JSX.Element {
  const classes = useStyles()

  const { roles } = props.globals.course
  console.log('Roles: ' + roles.toString())
  if (roles.length === 0) return <ErrorAlert />

  const mostPrivRole = props.globals.course.roles.sort(
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

  const [activePageState, setActivePageState] = useState<PageState>(PageState.SelectSection)
  const [inputMethod, setInputMethod] = useState<InputMethod | undefined>(undefined)
  const [sections, setSections] = useState<SelectableCanvasCourseSection[] | undefined>(undefined)
  const [selectedSection, setSelectedSection] = useState<SelectableCanvasCourseSection | undefined>(undefined)

  const [doGetSections, isGetSectionsLoading, getSectionsError, clearGetSectionsError] = usePromise(
    async () => await api.getCourseSections(props.globals.course.id),
    (sections: CanvasCourseSection[]) => setSections(injectCourseName(sections, props.course.name))
  )

  useEffect(() => {
    if (sections === undefined) {
      void doGetSections()
    }
  }, [sections, getSectionsError])

  const renderSelectSection = (): JSX.Element => {
    if (getSectionsError !== undefined) {
      const errorMessage = <Typography key={0}>An error occurred while loading section data from Canvas</Typography>
      return <ErrorAlert messages={[errorMessage]} tryAgain={clearGetSectionsError} />
    }

    return (
      <div>
        <Typography align='left'>
          Select the section you want to enroll users in.
        </Typography>
        <div className={classes.selectContainer}>
          <SectionSelectorWidget
            height={300}
            search={[]}
            multiSelect={false}
            sections={sections !== undefined ? sections : []}
            selectedSections={selectedSection !== undefined ? [selectedSection] : []}
            selectionUpdated={(sections) => {
              if (sections.length === 0) {
                setSelectedSection(undefined)
              } else {
                setSelectedSection(sections[0])
              }
            }}
            canUnmerge={false}
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
        <Grid container className={classes.spacing} justify='flex-end'>
          <Button
            color='primary'
            variant='contained'
            disabled={selectedSection === undefined}
            aria-label='Select section'
            onClick={() => setActivePageState(PageState.SelectInputMethod)}
          >
            Select
          </Button>
        </Grid>
      </div>
    )
  }

  const renderSelectInputMethod = (): JSX.Element => {
    return (
      <UserMethodSelect
        selectedInputMethod={inputMethod}
        setInputMethod={setInputMethod}
        onButtonClick={() => setActivePageState(PageState.AddSingleUser)}
      />
    )
  }

  const renderAddSingleUser = (): JSX.Element => {
    return (
      <>
      <Typography variant='h6' component='h2' gutterBottom>Add Single User Manually</Typography>
      <UserEnrollmentForm
        rolesUserCanAdd={rolesUserCanAdd}
        enrollExistingUser={async () => undefined}
        enrollNewUser={async () => undefined}
      />
      </>
    )
  }

  const renderActivePageState = (state: PageState): JSX.Element => {
    switch (state) {
      case PageState.SelectSection:
        return renderSelectSection()
      case PageState.SelectInputMethod:
        return renderSelectInputMethod()
      case PageState.AddSingleUser:
        return renderAddSingleUser()
      default:
        return <ErrorAlert />
    }
  }

  return (
    <div className={classes.root}>
      <Help baseHelpURL={props.globals.baseHelpURL} helpURLEnding={props.helpURLEnding} />
      <Typography variant='h5' component='h1' gutterBottom>{props.title}</Typography>
      {renderActivePageState(activePageState)}
    </div>
  )
}
