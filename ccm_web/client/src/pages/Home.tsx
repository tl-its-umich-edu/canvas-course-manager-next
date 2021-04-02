import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'

import FeatureCard from '../components/FeatureCard'
import allFeatures, { FeatureUIGroup } from '../models/FeatureUIData'
import { Typography } from '@material-ui/core'

const useStyles = makeStyles((theme) => ({
  root: {
    '& .MuiGrid-item': {
      backgroundColor: 'red'
    },
    padding: 25
  },
  title: {
    '& .MuiGrid-item': {
      backgroundColor: 'green'
    },
    textAlign: 'left'
  },
  featureGroupContainer: {
    paddingTop: '2px'
  },
  featureCardContainer: {
    padding: '5px'
  }
}))

function FeatureGroup (featureGroup: FeatureUIGroup): JSX.Element {
  const classes = useStyles()
  return (
    <Grid key={featureGroup.id} className={classes.featureGroupContainer} container item xs={12} spacing={3}>
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
  const features = allFeatures
  return (
    <div className={classes.root}>
      <Grid container spacing={3}>
        {features.sort((a, b) => (a.ordinality < b.ordinality) ? -1 : 1).map(featureGroup => {
          return (FeatureGroup(featureGroup))
        })}
      </Grid>
    </div>
  )
}

export { Home as default }
