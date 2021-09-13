import React from 'react'
import { Button, makeStyles, Typography } from '@material-ui/core'

const useStyles = makeStyles(() => ({
  root: {
    padding: 25,
    textAlign: 'left'
  },
  button: {
    marginTop: 15
  }
}))

export default function AuthorizePrompt (): JSX.Element {
  const classes = useStyles()
  return (
    <div className={classes.root}>
      <Typography variant='h5' component='h1' gutterBottom>Canvas Integration</Typography>
      <Typography gutterBottom>
        To use Canvas Course Manager, you must first authorize the tool to make requests to Canvas on your behalf.
        To do so, click the &quot;Go to Canvas&quot; button below, which will redirect you to a Canvas prompt.
      </Typography>
      <Typography gutterBottom>
        <b>Note:</b> If you have done this before, it is likely that your integration was removed in Canvas.
      </Typography>
      <Button
        className={classes.button}
        color='primary'
        variant='contained'
        href='/canvas/redirectOAuth'
        aria-label='Authorize Canvas integration'
      >
        Go to Canvas
      </Button>
    </div>
  )
}
