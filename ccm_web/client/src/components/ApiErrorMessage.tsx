import React from 'react'
import { Typography } from '@material-ui/core'

import { CanvasError } from '../utils/handleErrors'

interface ApiErrorMessageProps {
  context: string
  error: Error | undefined
}

const extractErrorText = (error: Error): string[] => {
  if (error instanceof CanvasError) {
    return error.errors.map(e => e.message)
  } else {
    return [error.message]
  }
}

export default function ApiErrorMessage (props: ApiErrorMessageProps): JSX.Element {
  const errorMessages = props.error !== undefined ? extractErrorText(props.error) : []
  const preface = (
    `Error${errorMessages.length > 1 ? 's' : ''} occurred ` +
    `while ${props.context}${props.error !== undefined ? ':' : '.'}`
  )
  return <Typography>{preface}&nbsp;{errorMessages.join('; ')}</Typography>
}
