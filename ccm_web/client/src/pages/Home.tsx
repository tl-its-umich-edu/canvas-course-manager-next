import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'

import FeatureCard, { mergeSectionCardProps, gradebookToolsCardProps, createSectionsCardProps, addUMUsersCardProps, addNonUMUsersCardProps } from '../components/FeatureCard'

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    minWidth: 275,
    padding: 25
  }
}))

function Home (): JSX.Element {
  const classes = useStyles()
  const featureCards = [mergeSectionCardProps, gradebookToolsCardProps, createSectionsCardProps, addUMUsersCardProps, addNonUMUsersCardProps]
  return (
    <div className={classes.root}>
      <Grid container spacing={3}>
        {featureCards.sort((a, b) => (a.feature.ordinality < b.feature.ordinality) ? -1 : 1).map(p => {
          return (
            <Grid key={p.feature.id} item xs={12} sm={4}>
              <FeatureCard {...p} />
            </Grid>
          )
        })}
      </Grid>
    </div>
  )
}

export { Home as default }
