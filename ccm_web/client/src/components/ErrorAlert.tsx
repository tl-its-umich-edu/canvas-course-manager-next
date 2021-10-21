import React from 'react'
import { Button, Grid, makeStyles, Paper, Typography } from '@material-ui/core'
import ErrorIcon from '@material-ui/icons/Error'

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
  },
  dialogIcon: {
    color: '#3F648E'
  }
}))

interface ErrorAlertProps {
  // Spacing works out best when you use Material UI Typography components or p tags.
  messages?: JSX.Element[]
  tryAgain?: () => void
  icon?: JSX.Element
}

export default function ErrorAlert (props: ErrorAlertProps): JSX.Element {
  const classes = useStyles()
  const defaultMessage = <Typography>Something went wrong. Please try again later.</Typography>
  const preface = (
    <>
    <Typography gutterBottom>One or more errors occurred.</Typography>
    <Typography gutterBottom>If possible, fix the issue(s), and/or try again.</Typography>
    </>
  )

  const { messages, tryAgain, icon } = props

  const messageBlock = (messages === undefined || messages.length === 0)
    ? defaultMessage
    : messages.length === 1
      ? messages[0]
      : <ol>{messages.map((m, i) => <li key={i}>{m}</li>)}</ol>

  return (
    <Grid item xs={12} sm={9} md={6} className={`${classes.dialog} ${classes.padding}`}>
      <Paper className={classes.padding} role='alert'>
        {icon !== undefined ? icon : <ErrorIcon className={classes.dialogIcon} fontSize='large' />}
        {Boolean(messages?.length) && preface}
        {messageBlock}
        {tryAgain !== undefined && <Button color='primary' component='span' onClick={props.tryAgain}>Try Again</Button>}
      </Paper>
    </Grid>
  )
}
