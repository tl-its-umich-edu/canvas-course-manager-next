import React from 'react'
import { Grid, Paper, Typography, makeStyles, Link } from '@material-ui/core'
import ErrorIcon from '@material-ui/icons/Error'

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary
  },
  dialogIcon: {
    color: theme.palette.error.main
  }
}))

export default function AccessDenied (): JSX.Element {
  const classes = useStyles()
  const fourHelpLink = 'https://its.umich.edu/help'
  return (
    <Grid item xs={12}>
    <Paper className={classes.paper} elevation={5} role='alert'>
      <ErrorIcon className={classes.dialogIcon} fontSize='large' />
      <Typography>Access Denied.</Typography>
      <Typography>To use Canvas Course Manager you must have a course management role in this course.</Typography>
      <Typography>If you believe this message is in error, please contact <Link style={{ textDecoration: 'underline' }} href={fourHelpLink} target='_blank' rel="noopener">4help@umich.edu</Link></Typography>
    </Paper>
  </Grid>
  )
}
