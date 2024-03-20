import { useSnackbar } from 'notistack'
import React, { useEffect } from 'react'

import { styled } from '@mui/material/styles'
import { Grid, Typography } from '@mui/material'

import APIErrorMessage from '../components/APIErrorMessage'
import FeatureCard from '../components/FeatureCard'
import Help from '../components/Help'
import InlineTextEdit from '../components/InlineTextEdit'
import { setCourseName as apiSetCourseName } from '../api'
import usePromise from '../hooks/usePromise'
import { courseRenameRoles } from '../models/feature'
import allFeatures, {
  FeatureUIGroup, FeatureUIProps, isAuthorizedForAnyFeature, isAuthorizedForFeature, isAuthorizedForRoles
} from '../models/FeatureUIData'
import { CsrfToken, Globals } from '../models/models'
import { CanvasCourseBase } from '../models/canvas'
import { courseNameInputSchema, validateString } from '../utils/validation'

const PREFIX = 'Home'

const classes = {
  courseName: `${PREFIX}-courseName`,
  courseNameContainer: `${PREFIX}-courseNameContainer`,
  title: `${PREFIX}-title`
}

const Root = styled('div')(({ theme }) => ({
  [`& .${classes.courseName}`]: {
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    textAlign: 'left'
  },
  [`& .${classes.courseNameContainer}`]: {
    marginBottom: theme.spacing(2)
  },
  [`& .${classes.title}`]: {
    textAlign: 'left',
    marginBottom: theme.spacing(1)
  }
}))

interface HomeProps {
  globals: Globals
  csrfToken: CsrfToken
  course: CanvasCourseBase | undefined
  getCourseError: Error | undefined
  setCourse: (course: CanvasCourseBase|undefined) => void
}

function Home (props: HomeProps): JSX.Element {
  console.log('Home', props)
  const { enqueueSnackbar } = useSnackbar()

  const setCourseNameAsync = async (
    newCourseName: string
  ): Promise<CanvasCourseBase|undefined> => {
    return await apiSetCourseName(props.globals.course.id, newCourseName, props.csrfToken.token)
  }

  const [doSetCourseName, setCourseNameLoading, setCourseNameError] = usePromise<CanvasCourseBase|undefined, typeof setCourseNameAsync>(
    setCourseNameAsync,
    (course: CanvasCourseBase|undefined) => {
      props.setCourse(course)
      enqueueSnackbar('Course name was saved! Please refresh the page to have the change appear in Canvas.', { variant: 'success' })
    }
  )

  useEffect(() => {
    if (setCourseNameError !== undefined) {
      enqueueSnackbar(
        <APIErrorMessage context='saving course name' error={setCourseNameError} />,
        { variant: 'error' }
      )
    }
  }, [setCourseNameError])

  const renderFeature = (feature: FeatureUIProps): JSX.Element => {
    return (
      <Grid key={feature.data.id} item xs={12} sm={6}>
        <FeatureCard {...feature} />
      </Grid>
    )
  }

  const renderFeatureGroup = (featureGroup: FeatureUIGroup): JSX.Element => {
    return (
      <Grid key={featureGroup.id} container item xs={12} spacing={0}>
        <Grid item xs={12}>
          <Typography variant='h6' component='h2' className={classes.title}>{featureGroup.title}</Typography>
        </Grid>
        <Grid container item xs={12} spacing={2}>
          {featureGroup.features.sort((a, b) => (a.data.ordinality < b.data.ordinality) ? -1 : 1)
            .filter(feature => {
              return isAuthorizedForFeature(props.globals.course.roles, feature)
            })
            .map(feature => {
              return renderFeature(feature)
            })}
        </Grid>
      </Grid>
    )
  }

  const renderCourseRename = (): JSX.Element => {
    if (props.course === undefined) {
      return (<div className={classes.courseName}>Error getting course name</div>)
    }

    let nameBlock
    if (isAuthorizedForRoles(props.globals.course.roles, courseRenameRoles)) {
      nameBlock = (
        <InlineTextEdit
          text={props.course.name}
          placeholderText='Course name'
          fontSize='1.5rem'
          validate={(value) => validateString(value, courseNameInputSchema)}
          save={doSetCourseName}
          isSaving={setCourseNameLoading}
        />
      )
    } else {
      nameBlock = props.course.name
    }

    return (
      <Grid className={classes.courseNameContainer} container alignItems='center'>
        <Grid item sm={10} xs={12}>
          <Typography className={classes.courseName} variant='h5' component='h1'>
            {nameBlock}
          </Typography>
        </Grid>
      </Grid>
    )
  }

  return (
    <Root>
    <Help baseHelpURL={props.globals.baseHelpURL} />
    <div className={classes.courseNameContainer}>
      {renderCourseRename()}
    </div>
    <Grid container spacing={3}>
      {allFeatures.sort((a, b) => (a.ordinality < b.ordinality) ? -1 : 1).filter(featureGroup => {
        return isAuthorizedForAnyFeature(props.globals.course.roles, featureGroup.features)
      }).map(featureGroup => {
        return (renderFeatureGroup(featureGroup))
      })}
    </Grid>
    </Root>
  )
}

export { Home as default }
