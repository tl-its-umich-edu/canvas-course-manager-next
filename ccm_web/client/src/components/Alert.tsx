import React from 'react'
import { Grid, makeStyles, Paper } from '@material-ui/core'

const useStyles = makeStyles((theme) => ({
  padding: {
    padding: theme.spacing(1)
  },
  dialog: {
    textAlign: 'center',
    margin: 'auto',
    marginTop: 30,
    marginBottom: 15,
    '& ol': {
      margin: 'auto'
    },
    '& li': {
      textAlign: 'left',
      marginBottom: 10
    }
  }
}))

interface AlertProps {
  children: React.ReactNode
  icon: JSX.Element
}

export default function Alert (props: AlertProps): JSX.Element {
  const classes = useStyles()
  const { icon, children } = props
  return (
    <Grid item xs={12} sm={9} md={6} className={`${classes.dialog} ${classes.padding}`}>
      <Paper className={classes.padding} role='alert'>
        {icon}
        {children}
      </Paper>
    </Grid>
  )
}
