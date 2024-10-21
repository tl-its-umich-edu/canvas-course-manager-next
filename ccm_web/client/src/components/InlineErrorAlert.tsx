import React from 'react'
import { styled } from '@mui/material/styles'
import { Grid, Paper } from '@mui/material'
import { Error as ErrorIcon } from '@mui/icons-material'
import { red } from '@mui/material/colors'

const PREFIX = 'InlineErrorAlert'

const classes = {
  alert: `${PREFIX}-alert`,
  icon: `${PREFIX}-icon`
}

const StyledPaper = styled(Paper)((
  {
    theme
  }
) => ({
  [`&.${classes.alert}`]: {
    marginBottom: theme.spacing(2),
    padding: theme.spacing(1),
    color: theme.palette.error.dark,
    backgroundColor: red[50]
  },

  [`& .${classes.icon}`]: {
    color: theme.palette.error.main
  }
}))

interface InlineAlertProps {
  children: React.ReactNode
  icon?: boolean
}

/*
Temporary implementation of inline Alert. This is implemented in Material UI 4's lab package
but is part of the core later in 5. We can use that once we update.
*/

export default function InlineErrorAlert (props: InlineAlertProps): JSX.Element {
  return (
    <StyledPaper className={classes.alert} elevation={0} role='alert'>
      <Grid container spacing={2} alignItems='center' direction='row' wrap='nowrap'>
        <Grid item><ErrorIcon className={classes.icon} /></Grid>
        <Grid item>{props.children}</Grid>
      </Grid>
    </StyledPaper>
  )
}
