import React from 'react'
import { Grid, makeStyles, Paper } from '@material-ui/core'
import red from '@material-ui/core/colors/red'
import ErrorIcon from '@material-ui/icons/Error'

const useStyles = makeStyles((theme) => ({
  alert: {
    marginBottom: theme.spacing(2),
    padding: theme.spacing(1),
    color: theme.palette.error.dark,
    backgroundColor: red[50]
  },
  icon: {
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
  const classes = useStyles()
  return (
    <Paper className={classes.alert} elevation={0} aria-role='alert'>
      <Grid container spacing={2} alignItems='center' direction='row'>
        <Grid item><ErrorIcon className={classes.icon} /></Grid>
        <Grid item>{props.children}</Grid>
      </Grid>
    </Paper>
  )
}
