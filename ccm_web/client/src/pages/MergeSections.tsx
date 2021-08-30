import React, { useState } from 'react'

import { Grid, makeStyles, Paper, Typography } from '@material-ui/core'
import { CCMComponentProps } from '../models/FeatureUIData'
import { mergeSectionProps } from '../models/feature'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: 25,
    textAlign: 'left',
    '& button': {
      margin: 5
    }
  },
  selectSections: {
    // flexGrow: 1
    // width: '100%'
  }
}))

enum PageState {
  SelectSections = 0
}

function MergeSections (props: CCMComponentProps): JSX.Element {
  const classes = useStyles()
  const [pageState, setPageState] = useState<PageState>(PageState.SelectSections)

  const renderComponent = (): JSX.Element => {
    switch (pageState) {
      case PageState.SelectSections:
        return getSelectSections()
      default:
        return <div>?</div>
    }
  }

  const getSelectSections = (): JSX.Element => {
    return (
      <Grid className={classes.selectSections} container spacing={2}>
        <Grid container item sm={12} md>
          <Paper>Sections</Paper>
        </Grid>
        <Grid container item sm={12} md>
          <Paper>Prepared to merge</Paper>
        </Grid>
      </Grid>
    )
  }

  return (
    <div className={classes.root}>
      <Typography variant='h5'>{mergeSectionProps.title}</Typography>
      {renderComponent()}
    </div>
  )
}

export default MergeSections
