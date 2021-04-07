import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'

import InlineTextEdit from '../components/InlineTextEdit'
import FeatureCard from '../components/FeatureCard'
import allFeatures, { FeatureUIGroup } from '../models/FeatureUIData'
import { Typography } from '@material-ui/core'

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
  }
}))

function FeatureGroup (featureGroup: FeatureUIGroup): JSX.Element {
  const classes = useStyles()
  return (
    <Grid key={featureGroup.id} container item xs={12} spacing={0}>
      <Grid item xs={12}><Typography variant='h6' className={classes.title} >{featureGroup.title}</Typography></Grid>
      <Grid container item xs={12}>
        {featureGroup.features.sort((a, b) => (a.data.ordinality < b.data.ordinality) ? -1 : 1).map(feature => {
          return (
            <Grid key={feature.data.id} item className={classes.featureCardContainer} xs={12} sm={4}>
              <FeatureCard {...feature} />
            </Grid>
          )
        })}
      </Grid>
    </Grid>
  )
}

function Home (): JSX.Element {
  const classes = useStyles()
  const saveCourseName = async (courseName: string): Promise<void> => await new Promise<void>((resolve, reject) => {
    console.log('saveCourseName ' + courseName)
    if (courseName === 'reject') {
      reject(new Error('Rejected as requested'))
    } else {
      return resolve()
    }
  })

  const features = allFeatures

  return (
    <div className={classes.root}>
      <InlineTextEdit {...{ text: 'Course 123ABC', save: saveCourseName, placeholderText: 'Course name', successMessage: 'Saved', failureMessage: 'Error saving course name' }} />
      <Grid container spacing={3}>
        {features.sort((a, b) => (a.ordinality < b.ordinality) ? -1 : 1).map(featureGroup => {
          return (FeatureGroup(featureGroup))
        })}
      </Grid>
    </div>
  )
}

export { Home as default }
