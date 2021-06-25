import React, { useEffect, useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Grid, Typography } from '@material-ui/core'

import InlineTextEdit from '../components/InlineTextEdit'
import FeatureCard from '../components/FeatureCard'
import allFeatures, { FeatureUIGroup, FeatureUIProps, isAuthorizedForAnyFeature, isAuthorizedForFeature, isAuthorizedForRoles } from '../models/FeatureUIData'
import { getCourseName, setCourseName as apiSetCourseName, LtiProps } from '../api'
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

interface HomeProps extends LtiProps {
  ltiKey: string | undefined
  globals: Globals
}

function Home (props: HomeProps): JSX.Element {
  const classes = useStyles()
  const [courseName, setCourseName] = useState<undefined|string>(undefined)

  const [doLoadCourseName, isLoadingCourseName, getCourseNameError] = usePromise(
    async () => await getCourseName(props.ltiKey, props.globals.course.id),
    (value: CanvasCourseBase) => setCourseName(value.name)
  )

  const setCourseNameAsync = async (
    newCourseName: string
  ): Promise<CanvasCourseBase> => {
    return await apiSetCourseName(props.ltiKey, props.globals.course.id, newCourseName)
  }
  const [doSetCourseName, setCourseNameLoading, setCourseNameError] = usePromise(
    setCourseNameAsync,
    (course: CanvasCourseBase) => {
      setCourseName(course.name)
    }
  )

  useEffect(() => {
    void doLoadCourseName()
  }, [])

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
    if (isLoadingCourseName) {
      return (<div className={classes.courseName}>Loading...</div>)
    } else if (getCourseNameError !== undefined || courseName === undefined) {
      return (<div className={classes.courseName}>Error getting course name</div>)
    } else if (isAuthorizedForRoles(props.globals.course.roles, courseRenameRoles, 'Course Rename')) {
      return (<InlineTextEdit {...{ text: courseName, save: doSetCourseName, placeholderText: 'Course name', successMessage: 'Saved', failureMessage: 'Error saving course name' }}/>)
    } else {
      return (<Typography className={classes.courseName} variant='h5' component='h1'>{courseName}</Typography>)
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
