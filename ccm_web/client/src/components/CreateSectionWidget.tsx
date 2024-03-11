import { CODE_NUMPAD_ENTER, CODE_RETURN } from 'keycode-js'
import { styled } from '@mui/material/styles'
import { useSnackbar } from 'notistack'
import React, { ChangeEvent, useState } from 'react'
import { Button, Grid, TextField } from '@mui/material'

import APIErrorMessage from './APIErrorMessage'
import { addCourseSections } from '../api'
import { CanvasCourseBase, CanvasCourseSection } from '../models/canvas'
import { CanvasCoursesSectionNameValidator, ICanvasSectionNameInvalidError } from '../utils/canvasSectionNameValidator'

const PREFIX = 'CreateSectionWidget'

const classes = {
  root: `${PREFIX}-root`,
  input: `${PREFIX}-input`,
  button: `${PREFIX}-button`
}

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled('div')((
  {
    theme
  }
) => ({
  [`& .${classes.root}`]: {
    backgroundColor: '#FAFAFA',
    height: 200
  },

  [`& .${classes.input}`]: {
    width: '100%'
  },

  [`& .${classes.button}`]: {
    width: '100%'
  }
}))

export interface CreateSectionWidgetProps {
  course: CanvasCourseBase
  onSectionCreated: (newSection: CanvasCourseSection) => void
}

function CreateSectionWidget (props: CreateSectionWidgetProps): JSX.Element {
  const { enqueueSnackbar } = useSnackbar()
  const [newSectionName, setNewSectionName] = useState<string>('')
  const [isCreating, setIsCreating] = useState(false)
  const nameValidator = new CanvasCoursesSectionNameValidator(props.course.id)

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
        addCourseSections(props.course.id, [newSectionName])
          .then(newSections => {
            props.onSectionCreated(newSections[0])
            setNewSectionName('')
            enqueueSnackbar('Section was created!', { variant: 'success' })
          }).catch((error: unknown) => {
            enqueueSnackbar(
              <APIErrorMessage
                context='creating the section'
                error={error instanceof Error ? error : undefined}
              />,
              { variant: 'error' }
            )
          })
      } else {
        errorAlert(errors)
      }
    }).catch((error: unknown) => {
      enqueueSnackbar(
        <APIErrorMessage
          context='validating section name'
          error={error instanceof Error ? error : undefined}
        />,
        { variant: 'error' }
      )
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
    (<Root>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={9}>
          <TextField className={classes.input} size='small' label='input the name of the new section' variant='outlined' id="outlined-basic" onChange={newSectionNameChanged} value={newSectionName} onKeyDown={(e) => keyDown(e.code)}/>
        </Grid>
        <Grid item xs={12} sm>
          <Button className={classes.button} variant="contained" color="primary" onClick={createSection} value={newSectionName} disabled={isCreateDisabled()}>
            Create
          </Button>
        </Grid>
      </Grid>
    </Root>)
  )
}

export default CreateSectionWidget
