import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'

import FeatureCard from '../components/FeatureCard'
import AllFeatures from '../models/FeatureCardData'

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    minWidth: 275,
    padding: 25
  }
}))

function Home (): JSX.Element {
  const classes = useStyles()
  const features = AllFeatures
  return (
    <div className={classes.root}>
      <Grid container spacing={3}>
        {features.sort((a, b) => (a.data.ordinality < b.data.ordinality) ? -1 : 1).map(featureProps => {
          return (
            <Grid key={featureProps.data.id} item xs={12} sm={4}>
              <FeatureCard {...featureProps} />
            </Grid>
          )
        })}
      </Grid>
    </div>
  )
}

export { Home as default }
