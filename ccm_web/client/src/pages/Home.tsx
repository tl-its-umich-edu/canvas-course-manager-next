import React, { useEffect } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Grid, Typography } from '@material-ui/core'
import { useSnackbar } from 'notistack'

import InlineTextEdit from '../components/InlineTextEdit'
import FeatureCard from '../components/FeatureCard'
import allFeatures, { FeatureUIGroup, FeatureUIProps, isAuthorizedForAnyFeature, isAuthorizedForFeature, isAuthorizedForRoles } from '../models/FeatureUIData'
import { setCourseName as apiSetCourseName } from '../api'
import { courseRenameRoles } from '../models/feature'
import { Globals } from '../models/models'
import { CanvasCourseBase } from '../models/canvas'
import usePromise from '../hooks/usePromise'

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
  courseName: {
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
    } else if (isAuthorizedForRoles(props.globals.course.roles, courseRenameRoles, 'Course Rename')) {
      return (<InlineTextEdit {...{ text: props.course.name, save: doSetCourseName, placeholderText: 'Course name', isSaving: setCourseNameLoading }}/>)
    } else {
      return (<Typography className={classes.courseName} variant='h5' component='h1'>{props.course.name}</Typography>)
    }
  }

  const renderFeatures = (): JSX.Element => {
    const features = allFeatures
    return (
      <>
        {renderCourseRename()}
        <Grid container spacing={3}>
          {features.sort((a, b) => (a.ordinality < b.ordinality) ? -1 : 1).filter(featureGroup => {
            return isAuthorizedForAnyFeature(props.globals.course.roles, featureGroup.features)
          }).map(featureGroup => {
            return (renderFeatureGroup(featureGroup))
          })}
        </Grid>
      </>)
  }

  return (
    <div className={classes.root}>
      {renderFeatures()}
    </div>
  )
}

export { Home as default }
