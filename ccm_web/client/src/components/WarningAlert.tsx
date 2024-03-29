import React from 'react'
import { styled } from '@mui/material/styles'
import { Button } from '@mui/material'
import ErrorIcon from '@mui/icons-material/Error'

import Alert from './Alert.js'

const PREFIX = 'WarningAlert'

const classes = {
  dialogIcon: `${PREFIX}-dialogIcon`,
  dialogButton: `${PREFIX}-dialogButton`
}

const StyledAlert = styled(Alert)((
  {
    theme
  }
) => ({
  [`& .${classes.dialogIcon}`]: {
    color: theme.palette.warning.main
  },

  [`& .${classes.dialogButton}`]: {
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
  const { messages, cancel, cont, title, icon, embedded } = props

  const messageBlock = messages.length === 1
    ? messages[0]
    : <ol>{messages.map((m, i) => <li key={i}>{m}</li>)}</ol>

  return (
    <StyledAlert
      title={title !== undefined ? title : 'Some warnings occurred'}
      icon={icon !== undefined ? icon : <ErrorIcon className={classes.dialogIcon} fontSize='large' />}
      embedded={embedded}
    >
      {messageBlock}
      <Button className={classes.dialogButton} color='primary' variant='outlined' onClick={cancel}>Cancel</Button>
      <Button className={classes.dialogButton} color='primary' variant='contained' onClick={cont}>Continue</Button>
    </StyledAlert>
  )
}
