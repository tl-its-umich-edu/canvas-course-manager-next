import React from 'react'
import { Button, makeStyles } from '@material-ui/core'
import ErrorIcon from '@material-ui/icons/Error'

import Alert from './Alert'

const useStyles = makeStyles((theme) => ({
  dialogIcon: {
    color: theme.palette.warning.main
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
  title?: string
  icon?: JSX.Element
  embedded?: boolean
}

export default function ErrorAlert (props: WarningAlertProps): JSX.Element {
  const classes = useStyles()
  const { messages, cancel, cont, title, icon, embedded } = props

  const messageBlock = messages.length === 1
    ? messages[0]
    : <ol>{messages.map((m, i) => <li key={i}>{m}</li>)}</ol>

  return (
    <Alert
      title={title !== undefined ? title : 'Some warnings occurred'}
      icon={icon !== undefined ? icon : <ErrorIcon className={classes.dialogIcon} fontSize='large' />}
      embedded={embedded}
    >
      {messageBlock}
      <Button className={classes.dialogButton} color='primary' variant='outlined' onClick={cancel}>Cancel</Button>
      <Button className={classes.dialogButton} color='primary' variant='contained' onClick={cont}>Continue</Button>
    </Alert>
  )
}
