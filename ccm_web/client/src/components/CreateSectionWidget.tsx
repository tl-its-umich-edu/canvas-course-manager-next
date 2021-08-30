import { Button, Grid, makeStyles, TextField } from '@material-ui/core'
import React, { ChangeEvent, useState } from 'react'
import { useSnackbar } from 'notistack'
import { addCourseSections } from '../api'
import { CanvasCourseSection } from '../models/canvas'
import { CCMComponentProps } from '../models/FeatureUIData'
import { CanvasCoursesSectionNameValidator, ICanvasSectionNameInvalidError } from '../utils/canvasSectionNameValidator'
import { CODE_NUMPAD_ENTER, CODE_RETURN } from 'keycode-js'

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: '#FAFAFA',
    height: 200
  },
  input: {
    width: '100%',
    paddingRight: '2px'
  },
  button: {
    width: '100%'
  }
}))

export interface CreateSectionWidgetProps extends CCMComponentProps {
  onSectionCreated: (newSection: CanvasCourseSection) => void
}

function CreateSectionWidget (props: CreateSectionWidgetProps): JSX.Element {
  const classes = useStyles()
  const { enqueueSnackbar } = useSnackbar()
  const [newSectionName, setNewSectionName] = useState<string>('')
  const [isCreating, setIsCreating] = useState(false)
  const nameValidator = new CanvasCoursesSectionNameValidator(props.globals.course)

  const newSectionNameChanged = (event: ChangeEvent<HTMLInputElement>): void => {
    setNewSectionName(event.target.value)
  }

  const errorAlert = (errors: ICanvasSectionNameInvalidError[]): void => {
    const errorMessage = errors.map(e => { return e.reason }).join('<br/>')
    enqueueSnackbar(errorMessage, {
      variant: 'error'
    })
  }

  const createSection = (): void => {
    if (newSectionName.trim().length === 0) {
      return
    }
    setIsCreating(true)
    nameValidator.validateSectionName(newSectionName).then(errors => {
      if (errors.length === 0) {
        addCourseSections(props.globals.course.id, [newSectionName])
          .then(newSections => {
            props.onSectionCreated(newSections[0])
            setNewSectionName('')
          }).catch(() => {
            enqueueSnackbar('Error adding section', {
              variant: 'error'
            })
          })
      } else {
        errorAlert(errors)
      }
    }).catch(() => {
      enqueueSnackbar('Error validating section name', {
        variant: 'error'
      })
    }).finally(() => {
      setIsCreating(false)
    })
  }

  const isCreateDisabled = (): boolean => {
    return isCreating || newSectionName.trim().length === 0
  }

  const keyDown = (code: string): void => {
    if (isCreateDisabled()) return
    if (code === CODE_RETURN || code === CODE_NUMPAD_ENTER) {
      createSection()
    }
  }

  return (
    <>
    <Grid container>
      <Grid item xs={9}>
        <TextField className={classes.input} size='small' label='New Section Name' variant='outlined' id="outlined-basic" onChange={newSectionNameChanged} value={newSectionName} onKeyDown={(e) => keyDown(e.code)}/>
      </Grid>
      <Grid item>
        <Button className={classes.button} variant="contained" color="primary" onClick={createSection} value={newSectionName} disabled={isCreateDisabled()}>
          Create
        </Button>
      </Grid>
    </Grid>
    </>
  )
}

export default CreateSectionWidget
