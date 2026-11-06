import { Button } from '@mui/material'
import { Error as ErrorIcon } from '@mui/icons-material'

import Alert from './Alert.js'

import type { JSX } from 'react'

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
    <Alert
      title={title !== undefined ? title : 'Some warnings occurred'}
      icon={icon !== undefined ? icon : <ErrorIcon fontSize='large' />}
      embedded={embedded}
      severity='warning'
    >
      {messageBlock}
      <Button sx={{ margin: '5px' }} color='primary' variant='outlined' onClick={cancel}>Cancel</Button>
      <Button sx={{ margin: '5px' }} color='primary' variant='contained' onClick={cont}>Continue</Button>
    </Alert>
  )
}
