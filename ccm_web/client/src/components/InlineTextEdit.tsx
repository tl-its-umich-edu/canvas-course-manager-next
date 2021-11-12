import React, { useEffect, useRef, useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Button, Grid, TextField, Typography } from '@material-ui/core'
import { Edit as EditIcon } from '@material-ui/icons'
import { CODE_ENTER, CODE_NUMPAD_ENTER, CODE_ESCAPE } from 'keycode-js'

interface InlineTextEditProps {
  text: string
  placeholderText: string
  fontSize: string
  isSaving: boolean
  save: (text: string) => Promise<void>
}

const useStyles = makeStyles(() => ({
  root: {
    textAlign: 'left',
    padding: '5px',
    whiteSpace: 'pre-wrap',
    '& .MuiInputBase-root.Mui-disabled': {
      color: 'rgba(0, 0, 0, 0.6)' // (default alpha is 0.38)
    },
    '& input:disabled': {
      cursor: 'pointer'
    }
  },
  editIcon: {
    cursor: 'pointer'
  },
  buttonSep: {
    marginRight: 15
  },
  button: {
    margin: 5
  }
}))

function InlineTextEdit (props: InlineTextEditProps): JSX.Element {
  const classes = useStyles()
  const [isEditing, setIsEditing] = useState(false)
  const [tempTextValue, setTempTextValue] = useState(props.text)
  const textInput = useRef(null)

  useEffect(() => {
    if (isEditing) setTempTextValue(props.text)
  }, [isEditing])

  const save = async (): Promise<void> => {
    if (props.text === tempTextValue) return
    await props.save(tempTextValue)
    setIsEditing(false)
  }

  const cancel = (): void => {
    setIsEditing(false)
    setTempTextValue(props.text)
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

  return (
    <Grid className={classes.root} container alignItems='center'>
      <Grid item md={8} sm={8} xs={12}>
        {
          isEditing
            ? (
                <form noValidate autoComplete='off'>
                  <Grid container>
                    <Grid item md={9} sm={7} xs={7}>
                      <TextField
                        className={classes.buttonSep}
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
                        onChange={(e) => setTempTextValue(e.target.value)}
                        disabled={!isEditing && props.isSaving}
                      />
                    </Grid>
                    <Grid item md={3} sm={5} xs={5}>
                      <Button
                        className={classes.button}
                        disabled={props.text === tempTextValue || props.isSaving}
                        onClick={save}
                        aria-label='Save course name'>
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
                <Typography className={classes.buttonSep} variant='inherit'>{props.text}</Typography>
                <Button onClick={toggleEdit} disabled={props.isSaving} aria-label='Edit course name'>
                  <EditIcon className={classes.editIcon} style={{ fontSize: props.fontSize }} />
                </Button>
                </>
              )
        }
      </Grid>
    </Grid>
  )
}

export type { InlineTextEditProps }
export default InlineTextEdit
