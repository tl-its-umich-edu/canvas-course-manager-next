import React from 'react'
import { Grid, makeStyles, Paper, Typography } from '@material-ui/core'

const useStyles = makeStyles((theme) => ({
  padding: {
    padding: theme.spacing(1)
  },
  standalone: {
    margin: 'auto'
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
  title: string
  icon: JSX.Element
  embedded?: boolean
}

export default function Alert (props: AlertProps): JSX.Element {
  const classes = useStyles()
  const { title, icon, embedded, children } = props

  const core = (
    <Paper className={`${classes.dialog} ${classes.padding}`} role='alert'>
      <Typography gutterBottom>{title}</Typography>
      {icon}
      {children}
    </Paper>
  )

  if (embedded === true) return core
  return (
    <Grid item xs={12} sm={9} md={6} className={classes.standalone}>
      {core}
    </Grid>
  )
}
