import React from 'react'
import { styled } from '@mui/material/styles'
import { Button, Typography } from '@mui/material'
import ErrorIcon from '@mui/icons-material/Error'

import Alert from './Alert.js'

const PREFIX = 'ErrorAlert'

const classes = {
  dialogIcon: `${PREFIX}-dialogIcon`
}

const StyledErrorIcon = styled(ErrorIcon)((
  {
    theme
  }
) => ({
  [`&.${classes.dialogIcon}`]: {
    color: theme.palette.error.main
  }
}))

interface ErrorAlertProps {
  // Spacing works out best when you use Material UI Typography components or p tags.
  messages?: JSX.Element[]
  tryAgain?: () => void | Promise<void>
  title?: string
  icon?: JSX.Element
  embedded?: boolean
}

export default function ErrorAlert (props: ErrorAlertProps): JSX.Element {
  const { messages, tryAgain, title, icon, embedded } = props

  const defaultMessage = <Typography>Something went wrong. Please try again later.</Typography>
  const preface = <Typography gutterBottom>If possible, fix the issue(s), and/or try again.</Typography>
  const messageBlock = (messages === undefined || messages.length === 0)
    ? defaultMessage
    : messages.length === 1
      ? messages[0]
      : <ol>{messages.map((m, i) => <li key={i}>{m}</li>)}</ol>

  return (
    <Alert
      title={title !== undefined ? title : 'Some errors occurred'}
      icon={icon !== undefined ? icon : <StyledErrorIcon className={classes.dialogIcon} fontSize='large' />}
      embedded={embedded}
    >
      {Boolean(messages?.length) && preface}
      {messageBlock}
      {tryAgain !== undefined && <Button color='primary' onClick={props.tryAgain}>Try Again</Button>}
    </Alert>
  )
}
