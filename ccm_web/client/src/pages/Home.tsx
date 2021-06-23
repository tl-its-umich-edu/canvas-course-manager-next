import React from 'react'
import { makeStyles } from '@material-ui/core/styles'

import InlineTextEdit from '../components/InlineTextEdit'
import FeatureCard from '../components/FeatureCard'
import allFeatures, { FeatureUIGroup, FeatureUIProps, isAuthorizedForAnyFeature, isAuthorizedForFeature, isAuthorizedForRoles } from '../models/FeatureUIData'

import { LtiProps } from '../api'
import useGlobals from '../hooks/useGlobals'
import { courseRenameRoles } from '../models/feature'
import { Grid, Typography } from '@material-ui/core'

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
}

function Home (props: HomeProps): JSX.Element {
  const [globals, isAuthenticated, loading, error] = useGlobals(props.ltiKey)
  const classes = useStyles()

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
              return isAuthorizedForFeature((globals != null) ? globals.course.roles : [], feature)
            })
            .map(feature => {
              return renderFeature(feature)
            })}
        </Grid>
      </Grid>
    )
  }

  const renderLoading = (): JSX.Element => {
    return (<span>Loading</span>)
  }

  const renderNotAuthenticated = (): JSX.Element => {
    return (<span>Not Authenticated</span>)
  }

  const renderError = (): JSX.Element => {
    return (<div id='error' hidden={error === undefined}>Error: {error?.message}</div>)
  }

  const renderCourseRename = (): JSX.Element => {
    if (isAuthorizedForRoles((globals != null) ? globals.course.roles : [], courseRenameRoles, 'Course Rename')) {
      const saveCourseName = async (courseName: string): Promise<void> => await new Promise<void>((resolve, reject) => {
        console.log('saveCourseName ' + courseName)
        if (courseName === 'reject') {
          reject(new Error('Rejected as requested'))
        } else {
          return resolve()
        }
      })
      return (<InlineTextEdit {...{ text: 'Course 123ABC', save: saveCourseName, placeholderText: 'Course name', successMessage: 'Saved', failureMessage: 'Error saving course name' }}/>)
    } else {
      return (<Typography className={classes.courseName} variant='h5' component='h1'>Course 123ABC</Typography>)
    }
  }

  const renderFeatures = (): JSX.Element => {
    const features = allFeatures

    if (loading) {
      return renderLoading()
    } else if (isAuthenticated !== undefined && !isAuthenticated) {
      return renderNotAuthenticated()
    } else if (error !== undefined) {
      return renderError()
    } else {
      return (
        <>
        {renderCourseRename()}
          <Grid container spacing={3}>
            {features.sort((a, b) => (a.ordinality < b.ordinality) ? -1 : 1).filter(featureGroup => {
              return isAuthorizedForAnyFeature((globals != null) ? globals.course.roles : [], featureGroup.features)
            }).map(featureGroup => {
              return (renderFeatureGroup(featureGroup))
            })}
          </Grid>
        </>)
    }
  }

  return (
    <div className={classes.root}>
      {renderFeatures()}
    </div>
  )
}

export { Home as default }
