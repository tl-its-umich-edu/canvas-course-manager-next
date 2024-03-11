import React from 'react'
import { styled } from '@mui/material/styles'
import { Typography } from '@mui/material'

const PREFIX = 'NotFound'

const classes = {
  root: `${PREFIX}-root`,
  spacing: `${PREFIX}-spacing`
}

const Root = styled('div')((
  {
    theme
  }
) => ({
  [`&.${classes.root}`]: {
    textAlign: 'left'
  },

  [`& .${classes.spacing}`]: {
    marginBottom: theme.spacing(2)
  }
}))

export default function NotFound (): JSX.Element {
  return (
    <Root className={classes.root}>
      <Typography variant='h5' component='h1' className={classes.spacing}>Not Found</Typography>
      <Typography gutterBottom>There is no content at this route.</Typography>
      <Typography>
        You can use the &quot;Canvas Course Manager&quot; link above to return to the home page.
      </Typography>
    </Root>
  )
}
