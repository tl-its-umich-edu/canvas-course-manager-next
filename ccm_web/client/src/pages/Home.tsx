import React, { useEffect } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Grid, Typography } from '@material-ui/core'
import { useSnackbar } from 'notistack'

import InlineTextEdit from '../components/InlineTextEdit'
import FeatureCard from '../components/FeatureCard'
import Help from '../components/Help'
import allFeatures, { FeatureUIGroup, FeatureUIProps, isAuthorizedForAnyFeature, isAuthorizedForFeature, isAuthorizedForRoles } from '../models/FeatureUIData'
import { setCourseName as apiSetCourseName } from '../api'
import { courseRenameRoles } from '../models/feature'
import { Globals } from '../models/models'
import { CanvasCourseBase } from '../models/canvas'
import usePromise from '../hooks/usePromise'
import { courseNameSchema, validateString } from '../utils/validation'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: 25,
    paddingTop: 5
  },
  title: {
    textAlign: 'left',
    paddingLeft: 5
  },
  featureCardContainer: {
    padding: 5
  },
  courseNameContainer: {
    marginBottom: 15
  },
  courseName: {
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    textAlign: 'left',
    padding: 5
  }
}))

interface HomeProps {
  globals: Globals
  course: CanvasCourseBase | undefined
  getCourseError: Error | undefined
  setCourse: (course: CanvasCourseBase|undefined) => void
}

function Home (props: HomeProps): JSX.Element {
  const { enqueueSnackbar } = useSnackbar()
  const classes = useStyles()

  const setCourseNameAsync = async (
    newCourseName: string
  ): Promise<CanvasCourseBase|undefined> => {
    return await apiSetCourseName(props.globals.course.id, newCourseName)
  }

  const [doSetCourseName, setCourseNameLoading, setCourseNameError] = usePromise<CanvasCourseBase|undefined, typeof setCourseNameAsync>(
    setCourseNameAsync,
    (course: CanvasCourseBase|undefined) => {
      props.setCourse(course)
      enqueueSnackbar('Course name saved', { variant: 'success' })
    }
  )

  useEffect(() => {
    if (setCourseNameError !== undefined) {
      enqueueSnackbar('Error saving course name', { variant: 'error' })
    }
  }, [setCourseNameError])

  const renderFeature = (feature: FeatureUIProps): JSX.Element => {
    return (
      <Grid key={feature.data.id} item className={classes.featureCardContainer} xs={12} sm={4}>
        <FeatureCard {...feature} />
      </Grid>
    )
  }

  const renderFeatureGroup = (featureGroup: FeatureUIGroup): JSX.Element => {
    return (
      <Grid key={featureGroup.id} container item xs={12} spacing={0}>
        <Grid item xs={12}><Typography variant='h6' component='h2' className={classes.title} >{featureGroup.title}</Typography></Grid>
        <Grid container item xs={12}>
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
    if (isAuthorizedForRoles(props.globals.course.roles, courseRenameRoles, 'Course Rename')) {
      nameBlock = (
        <InlineTextEdit
          text={props.course.name}
          placeholderText='Course name'
          fontSize='1.5rem'
          validate={(value) => validateString(value, courseNameSchema)}
          save={doSetCourseName}
          isSaving={setCourseNameLoading}
        />
      )
    } else {
      nameBlock = props.course.name
    }

    return (
      <Grid className={classes.courseNameContainer} container alignItems='center'>
        <Grid item md={8} sm={8} xs={12}>
          <Typography className={classes.courseName} variant='h5' component='h1'>
            {nameBlock}
          </Typography>
        </Grid>
      </Grid>
    )
  }

  const renderFeatures = (): JSX.Element => {
    const features = allFeatures
    return (
      <>
        <Help baseHelpURL={props.globals.baseHelpURL} />
        <div className={classes.courseNameContainer}>
          {renderCourseRename()}
        </div>
        <Grid container spacing={3}>
          {features.sort((a, b) => (a.ordinality < b.ordinality) ? -1 : 1).filter(featureGroup => {
            return isAuthorizedForAnyFeature(props.globals.course.roles, featureGroup.features)
          }).map(featureGroup => {
            return (renderFeatureGroup(featureGroup))
          })}
        </Grid>
      </>
    )
  }

  return (
    <div className={classes.root}>
      {renderFeatures()}
    </div>
  )
}

export { Home as default }
