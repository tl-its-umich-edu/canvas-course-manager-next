import React from 'react'
import { TextField } from '@material-ui/core'

import { ValidationResult } from '../utils/validation'

type TextChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>

interface ValidatedFormFieldProps {
  fieldName: string
  placeholder?: string
  ariaLabel?: string
  value?: string
  validationResult?: ValidationResult
  onChange: (e: TextChangeEvent) => void
  fullWidth?: boolean
  disabled?: boolean
  autoFocus?: boolean
}

/*
Thin wrapper for Material UI TextField adding validation logic and styling settings
*/
export default function ValidatedFormField (props: ValidatedFormFieldProps): JSX.Element {
  const error = props.validationResult !== undefined && !props.validationResult.isValid
  const helpMessage = props.validationResult === undefined || props.validationResult.isValid
    ? undefined
    : props.validationResult.messages.length > 0
      // Show one invalid message at a time
      ? props.validationResult.messages[0]
      : `Value for the ${props.fieldName.toLowerCase()} is invalid.`

  return (
    <TextField
      variant='outlined'
      placeholder={props.placeholder ?? props.fieldName}
      label={props.fieldName}
      aria-label={props.ariaLabel ?? props.fieldName}
      value={props.value !== undefined ? props.value : ''}
      onChange={props.onChange}
      error={error}
      helperText={helpMessage}
      fullWidth={props.fullWidth}
      disabled={props.disabled}
      autoFocus={props.autoFocus}
    />
  )
}
