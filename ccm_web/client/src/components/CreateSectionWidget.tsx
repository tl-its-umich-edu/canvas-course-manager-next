import { Button, Grid, makeStyles, TextField } from '@material-ui/core'
import React, { ChangeEvent, useState } from 'react'
import { useSnackbar } from 'notistack'
import { addCourseSections } from '../api'
import { CanvasCourseSection } from '../models/canvas'
import { CCMComponentProps } from '../models/FeatureUIData'
import { CanvaCoursesSectionNameValidator, ICanvasSectionNameInvalidError } from '../utils/canvasSectionNameValidator'

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
  const [newSectionName, setNewSectionName] = useState<string|undefined>(undefined)
  const nameValidator = new CanvaCoursesSectionNameValidator(props.globals.course)

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
    console.log('createSection')
    if (newSectionName === undefined) {
      return
    }

    nameValidator.validateSectionName(newSectionName).then(errors => {
      if (errors.length === 0) {
        addCourseSections(props.globals.course.id, [newSectionName])
          .then(newSections => {
            props.onSectionCreated(newSections[0])
          }).catch(e => {
            console.log('error adding section')
          })
      } else {
        errorAlert(errors)
      }
    }).catch(error => {
      console.log('error validating course section name ' + error)
    })
  }

  return (
    <>
    <Grid container>
      <Grid item xs={9}>
        <TextField className={classes.input} size='small' label='New Section Name' variant='outlined' id="outlined-basic" onChange={newSectionNameChanged}/>
      </Grid>
      <Grid item>
        <Button className={classes.button} variant="contained" color="primary" onClick={createSection} value={newSectionName} disabled={newSectionName === undefined}>
          Create
        </Button>
      </Grid>
    </Grid>
    </>
  )
}

export default CreateSectionWidget
