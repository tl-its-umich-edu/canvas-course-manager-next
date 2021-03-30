import React, { useRef, useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Button, Grid, TextField } from '@material-ui/core'
import { Edit as EditIcon } from '@material-ui/icons'
import { useSnackbar } from 'notistack'
import { CODE_ENTER, CODE_NUMPAD_ENTER, CODE_ESCAPE } from 'keycode-js'

interface InlineTextEditProps {
  text: string
  save: (courseName: string) => Promise<void>
}

const useStyles = makeStyles((theme) => ({
  root: {
    textAlign: 'left',
    padding: '5px',
    '& .MuiInputBase-root.Mui-disabled': {
      color: 'rgba(0, 0, 0, 0.6)' // (default alpha is 0.38)
    },
    '& svg': {
      paddingTop: '6px',
      paddingBottom: '7px'
    }
  },
  inputRow: {
    height: '60px',
    paddingTop: '6px',
    paddingBottom: '7px',
    fontSize: '30px'
  },
  editIcon: {
    cursor: 'pointer',
    fontSize: '30px'
  },
  inputArea: {
    width: '500px'
  }
}))

function InlineTextEdit (props: InlineTextEditProps): JSX.Element {
  const classes = useStyles()
  const [isEditing, setIsEditing] = useState(false)
  const [courseName, setCourseName] = useState(props.text)
  const [tempName, setTempName] = useState(props.text)

  const textInput = useRef(null)

  const { enqueueSnackbar } = useSnackbar()

  const save = (): void => {
    setIsEditing(false)
    if (courseName === tempName) return
    props.save(tempName)
      .then(() => {
        enqueueSnackbar('Saved', { variant: 'success' })
        setCourseName(tempName)
      })
      .catch(function () {
        enqueueSnackbar('Error saving course name:', { variant: 'error' })
        cancel()
      })
  }
  const cancel = (): void => {
    setIsEditing(false)
    setTempName(courseName)
  }
  const toggleEdit = (): void => {
    if (!isEditing) {
      setIsEditing(!isEditing)
    }
  }

  const keyPress = (code: string): void => {
    if (code === CODE_ENTER || code === CODE_NUMPAD_ENTER) {
      save()
    } else if (code === CODE_ESCAPE) {
      cancel()
    }
  }

  return (
    <form className={classes.root} noValidate autoComplete="off">
      <Grid container className={classes.inputArea}>
        <Grid item xs={8} sm={8}>
          <TextField className={classes.inputRow} aria-readonly={false} onClick={toggleEdit} inputProps={{ style: { fontSize: 30 } }} ref={textInput} id="standard-basic" placeholder='Course Name' value={tempName} onKeyDown={(e) => keyPress(e.code)} onChange={(e) => setTempName(e.target.value)} disabled={!isEditing}/>
        </Grid>
        {!isEditing
          ? (<Grid item xs={4} className={classes.inputRow}><EditIcon className={classes.editIcon} fontSize='inherit' onClick={toggleEdit}/></Grid>)
          : (<Grid container item xs={12} sm={4} className={classes.inputRow}>
              <Grid item xs={6} sm={6} >
                <Button disabled={courseName === tempName} onClick={save}>Save</Button>
              </Grid>
              <Grid item xs={6} sm={6} >
                <Button onClick={cancel}>Cancel</Button>
              </Grid>
            </Grid>)
        }
      </Grid>
    </form>
  )
}

export type { InlineTextEditProps }
export default InlineTextEdit
