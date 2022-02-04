import React from 'react'

import { makeStyles, Typography } from '@material-ui/core'

import InlineErrorAlert from '../components/InlineErrorAlert'

const useStyles = makeStyles((theme) => ({
  container: {
    margin: theme.spacing(2)
  }
}))

export default function LaunchError (): JSX.Element {
  const classes = useStyles()

  return (
    <div className={classes.container}>
      <InlineErrorAlert>
        <Typography variant='subtitle1' component='h1'>Launch Error</Typography>
        <Typography>
          The tool could not be launched. This is likely due to settings related to cookies on your Internet browser.
        </Typography>
      </InlineErrorAlert>
    </div>
  )
}
