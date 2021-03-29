import React, { useRef, useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Button, TextField } from '@material-ui/core'
import { Edit as EditIcon } from '@material-ui/icons'

interface InlineTextEditProps {
  text: string
  save: (courseName: string) => Promise<void>
}

const useStyles = makeStyles((theme) => ({
  root: {
    padding: '5px'
  }
}))

function InlineTextEdit (props: InlineTextEditProps): JSX.Element {
  const classes = useStyles()
  const [isEditing, setIsEditing] = useState(false)
  const [courseName, setCourseName] = useState(props.text)
  const [tempName, setTempName] = useState(props.text)

  const textInput = useRef(null)

  const save = (): void => {
    setIsEditing(false)
    props.save(tempName)
      .then(() => setCourseName(tempName))
      .catch(function (error: string) {
        alert('error: ' + error)
        cancel()
      })
  }
  const cancel = (): void => {
    setIsEditing(false)
    setTempName(courseName)
  }
  const toggleEdit = (): void => {
    setIsEditing(!isEditing)
  }

  const keyPress = (code: string): void => {
    if (code === 'Enter' || code === 'NumpadEnter') {
      save()
    } else if (code === 'Escape') {
      cancel()
    }
  }

  return (
    <form className={classes.root} noValidate autoComplete="off">
      <TextField ref={textInput} id="standard-basic" placeholder='Course Name' value={tempName} onKeyDown={(e) => keyPress(e.code)} onChange={(e) => setTempName(e.target.value)} disabled={!isEditing}/>
      {!isEditing
        ? (<EditIcon fontSize='small' onClick={toggleEdit}/>)
        : (<span>
        <Button onClick={save}>Save</Button>
        <Button onClick={cancel}>Cancel</Button>
        </span>)
      }
    </form>
  )
}

export type { InlineTextEditProps }
export default InlineTextEdit
