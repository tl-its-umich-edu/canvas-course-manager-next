import React from 'react'
import { Button, Grid, List, ListItem, makeStyles, Paper, Typography } from '@material-ui/core'
import ErrorIcon from '@material-ui/icons/Error'

const useStyles = makeStyles((theme) => ({
  dialog: {
    textAlign: 'center',
    maxWidth: '75%',
    margin: 'auto',
    marginTop: 30,
    marginBottom: 15,
    paddingLeft: 10,
    paddingRight: 10,
    width: '75%',
    '& ol': {
      margin: 'auto',
      width: '75%'
    },
    '& li': {
      textAlign: 'left'
    }
  },
  dialogIcon: {
    color: '#3F648E'
  }
}))

interface ErrorAlertProps {
  messages?: JSX.Element[]
  tryAgain?: () => void
  icon?: JSX.Element
}

export default function ErrorAlert (props: ErrorAlertProps): JSX.Element {
  const classes = useStyles()
  const defaultMessage = <Typography>Something went wrong. Please try again later.</Typography>
  const preface = (
    <Typography gutterBottom>
      Some errors occurred. If possible, correct them, and/or try again.
    </Typography>
  )

  const { messages, tryAgain, icon } = props

  const messageBlock = (messages === undefined || messages.length === 0)
    ? defaultMessage
    : messages.length === 1
      ? <Typography gutterBottom>{messages[0]}</Typography>
      : <List>{messages.map((m, i) => <ListItem key={i}>{m}</ListItem>)}</List>

  return (
    <Grid item xs={12} className={classes.dialog}>
      <Paper role='alert'>
        {icon !== undefined ? icon : <ErrorIcon className={classes.dialogIcon} fontSize='large' />}
        {Boolean(messages?.length) && preface}
        {messageBlock}
        {tryAgain !== undefined && <Button color='primary' component='span' onClick={props.tryAgain}>Try Again</Button>}
      </Paper>
    </Grid>
  )
}
