import React from 'react'
import { Button, makeStyles, Typography } from '@material-ui/core'
import ErrorIcon from '@material-ui/icons/Error'

import Alert from './Alert'

const useStyles = makeStyles(() => ({
  dialogIcon: {
    color: '#E2CF2A'
  },
  dialogButton: {
    margin: 5
  }
}))

interface WarningAlertProps {
  // Spacing works out best when you use Material UI Typography components or p tags.
  messages: JSX.Element[]
  cancel: () => void
  cont: () => void
  icon?: JSX.Element
}

export default function ErrorAlert (props: WarningAlertProps): JSX.Element {
  const classes = useStyles()
  const preface = (
    <Typography gutterBottom>One or more warnings occurred.</Typography>
  )

  const { messages, cancel, cont, icon } = props

  const messageBlock = messages.length === 1
    ? messages[0]
    : <ol>{messages.map((m, i) => <li key={i}>{m}</li>)}</ol>

  return (
    <Alert icon={icon !== undefined ? icon : <ErrorIcon className={classes.dialogIcon} fontSize='large' />}>
      {Boolean(messages?.length) && preface}
      {messageBlock}
      <Button className={classes.dialogButton} color='primary' variant='outlined' onClick={cancel}>Cancel</Button>
      <Button className={classes.dialogButton} color='primary' variant='contained' onClick={cont}>Continue</Button>
    </Alert>
  )
}
