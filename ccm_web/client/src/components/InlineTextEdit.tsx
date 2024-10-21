import React, { useEffect, useRef, useState } from 'react'
import { styled } from '@mui/material/styles'
import { Button, Grid, TextField, Typography } from '@mui/material'
import { Edit as EditIcon } from '@mui/icons-material'
import { CODE_ENTER, CODE_NUMPAD_ENTER, CODE_ESCAPE } from 'keycode-js'

import { ValidationResult } from '../utils/validation.js'

const PREFIX = 'InlineTextEdit'

const classes = {
  root: `${PREFIX}-root`,
  editIcon: `${PREFIX}-editIcon`,
  buttonSep: `${PREFIX}-buttonSep`,
  button: `${PREFIX}-button`
}

const Root = styled('div')(() => ({
  [`&.${classes.root}`]: {
    '& .MuiInputBase-root.Mui-disabled': {
      color: 'rgba(0, 0, 0, 0.6)' // (default alpha is 0.38)
    },
    '& input:disabled': {
      cursor: 'pointer'
    }
  },

  [`& .${classes.editIcon}`]: {
    cursor: 'pointer'
  },

  [`& .${classes.buttonSep}`]: {
    marginRight: 15
  },

  [`& .${classes.button}`]: {
    margin: 5
  }
}))

interface InlineTextEditProps {
  text: string
  placeholderText: string
  fontSize: string
  isSaving: boolean
  validate: (value: string | undefined) => ValidationResult
  save: (text: string) => Promise<void>
}

function InlineTextEdit (props: InlineTextEditProps): JSX.Element {
  const [isEditing, setIsEditing] = useState(false)
  const [tempTextValue, setTempTextValue] = useState(props.text)
  const [validationResult, setValidationResult] = useState<ValidationResult | undefined>(undefined)

  const textInput = useRef(null)

  // Resets tempTextValue in case when save fails
  useEffect(() => {
    if (isEditing) setTempTextValue(props.text)
  }, [isEditing])

  const save = async (): Promise<void> => {
    if (props.text === tempTextValue) return
    const result = props.validate(tempTextValue)
    if (!result.isValid) {
      return setValidationResult(result)
    }
    await props.save(tempTextValue)
    setIsEditing(false)
  }

  const cancel = (): void => {
    setIsEditing(false)
    setTempTextValue(props.text)
    setValidationResult(undefined)
  }

  const toggleEdit = (): void => {
    if (!isEditing) {
      setIsEditing(!isEditing)
    }
  }

  const keyPress = async (e: React.KeyboardEvent<HTMLDivElement>): Promise<void> => {
    if (e.code === CODE_ENTER || e.code === CODE_NUMPAD_ENTER) {
      e.preventDefault()
      await save()
    } else if (e.code === CODE_ESCAPE) {
      cancel()
    }
  }

  const error = validationResult !== undefined && !validationResult.isValid
  const helpMessage = validationResult === undefined || validationResult.isValid
    ? undefined
    : validationResult.messages.length > 0
      ? validationResult.messages[0]
      : 'Value for the field is invalid.'

  return (
    <Root className={classes.root}>
      {
        isEditing
          ? (
              <form noValidate autoComplete='off'>
                <Grid container>
                  <Grid item md={9} sm={7} xs={7}>
                    <TextField
                      className={classes.buttonSep}
                      variant='standard'
                      aria-readonly={false}
                      onClick={toggleEdit}
                      fullWidth={true}
                      inputProps={{ style: { fontSize: props.fontSize } }}
                      ref={textInput}
                      id='standard-basic'
                      autoFocus={true}
                      placeholder={props.placeholderText}
                      value={tempTextValue}
                      onKeyDown={keyPress}
                      onChange={(e) => {
                        setValidationResult(undefined)
                        setTempTextValue(e.target.value)
                      }}
                      disabled={!isEditing && props.isSaving}
                      error={error}
                      helperText={helpMessage}
                    />
                  </Grid>
                  <Grid item md={3} sm={5} xs={5}>
                    <Button
                      className={classes.button}
                      disabled={props.text === tempTextValue || props.isSaving}
                      onClick={save}
                      aria-label='Save course name'
                    >
                      Save
                    </Button>
                    <Button
                      className={classes.button}
                      disabled={props.isSaving}
                      onClick={cancel}
                      aria-label='Cancel editing course name'
                    >
                      Cancel
                    </Button>
                  </Grid>
                </Grid>
              </form>
            )
          : (
              <>
              <Typography className={classes.buttonSep} variant='inherit' component="span">{props.text}</Typography>
              <Button onClick={toggleEdit} disabled={props.isSaving} aria-label='Edit course name'>
                <EditIcon className={classes.editIcon} style={{ fontSize: props.fontSize }} />
              </Button>
              </>
            )
      }
    </Root>
  )
}

export type { InlineTextEditProps }
export default InlineTextEdit
