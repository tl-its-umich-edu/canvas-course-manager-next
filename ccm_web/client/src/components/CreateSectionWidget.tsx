import { Button, Grid, makeStyles, TextField } from '@material-ui/core'
import React from 'react'
import { CCMComponentProps } from '../models/FeatureUIData'

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

function CreateSectionWidget (props: CCMComponentProps): JSX.Element {
  const classes = useStyles()
  return (
    <>
    {/* <form className={classes.root} noValidate autoComplete="off"> */}
    <Grid container>
      <Grid item xs={9}>
        <TextField className={classes.input} size='small' label='New Section Name' variant='outlined' id="outlined-basic"/>
      </Grid>
      <Grid item>
        <Button className={classes.button} variant="contained" color="primary">
          Create
        </Button>
      </Grid>
    </Grid>
    {/* </form> */}
    </>
  )
}

export default CreateSectionWidget
