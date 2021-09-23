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
      <Typography variant='h5' component='h1' gutterBottom>
        Authorize Course Manager to Access Your Canvas Account
      </Typography>
      <Typography gutterBottom>
        This tool is not integrated with Canvas.
      </Typography>
      <Typography gutterBottom>
        Use the <b>GO TO AUTHORIZE PAGE button</b> to start the authorization process.
      </Typography>
      <Typography gutterBottom>
        <b>Note:</b> If you have done this before, it is likely that your integration was removed in Canvas.
      </Typography>
      <Button
        className={classes.button}
        color='primary'
        variant='contained'
        href='/canvas/redirectOAuth'
        aria-label='Go to authorize page'
      >
        GO TO AUTHORIZE PAGE
      </Button>
    </div>
  )
}
