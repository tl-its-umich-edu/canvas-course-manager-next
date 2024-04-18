import React from 'react'
import { styled } from '@mui/material/styles'
import { Button, Typography } from '@mui/material'

import Help from './Help.js'

const PREFIX = 'AuthorizePrompt'

const classes = {
  root: `${PREFIX}-root`,
  button: `${PREFIX}-button`
}

const Root = styled('div')(() => ({
  [`&.${classes.root}`]: {
    padding: 25,
    textAlign: 'left'
  },

  [`& .${classes.button}`]: {
    marginTop: 15
  }
}))

interface AuthorizePromptProps {
  helpURL: string
}

export default function AuthorizePrompt (props: AuthorizePromptProps): JSX.Element {
  return (
    <Root className={classes.root}>
      <Help baseHelpURL={props.helpURL} />
      <Typography variant='h5' component='h1' gutterBottom>
        Authorize Course Manager to Access Your Canvas Account
      </Typography>
      <Typography gutterBottom>
        This is a third-party tool. You must authorize this tool before you can use it.
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
    </Root>
  )
}
