import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'

import InlineTextEdit from '../components/InlineTextEdit'
import FeatureCard from '../components/FeatureCard'
import allFeatures from '../models/FeatureUIData'

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    minWidth: 275,
    padding: 25
  }
}))

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
      <InlineTextEdit {...{ text: 'Course 123ABC', save: saveCourseName }} />
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
