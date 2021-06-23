import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Grid, Typography } from '@material-ui/core'

import InlineTextEdit from '../components/InlineTextEdit'
import FeatureCard from '../components/FeatureCard'
import allFeatures, { FeatureUIGroup, FeatureUIProps, isAuthorizedForAnyFeature, isAuthorizedForFeature, isAuthorizedForRoles } from '../models/FeatureUIData'
import { LtiProps } from '../api'
import { courseRenameRoles } from '../models/feature'
import { Globals } from '../models/models'

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
    if (isAuthorizedForRoles(props.globals.course.roles, courseRenameRoles, 'Course Rename')) {
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
