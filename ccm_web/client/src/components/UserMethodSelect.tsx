import React from 'react'
import {
  Button, FormControl, FormControlLabel, FormLabel, makeStyles, Radio, RadioGroup
} from '@material-ui/core'

type InputMethod = 'single' | 'csv'

interface UserMethodSelectProps {
  selectedInputMethod: InputMethod | undefined
  setInputMethod: (method: InputMethod) => void
  onButtonClick: () => void
}

const useStyles = makeStyles((theme) => ({
  spacing: {
    marginBottom: theme.spacing(2)
  }
}))

export default function UserInputMethodSelect (props: UserMethodSelectProps): JSX.Element {
  const classes = useStyles()

  const handleChange = (e: React.ChangeEvent<{ name?: string, value: unknown }>): void => {
    const value = e.target.value
    if (value === 'single' || value === 'csv') {
      props.setInputMethod(value)
    }
  }

  return (
    <>
    <div className={classes.spacing}>
      <FormControl component='fieldset'>
        <FormLabel required className={classes.spacing}>Choose how you want to add users</FormLabel>
        <RadioGroup
          aria-label='Input method'
          value={props.selectedInputMethod}
          name='radio-buttons-group'
          onChange={handleChange}
        >
          <FormControlLabel
            value='single'
            control={<Radio color='primary' />}
            label='Add one user manually'
          />
          <FormControlLabel
            value='csv'
            color='primary'
            control={<Radio color='primary' />}
            label='Add multiple users by uploading a CSV'
          />
        </RadioGroup>
      </FormControl>
    </div>
    <Button
      color='primary'
      variant='contained'
      disabled={props.selectedInputMethod === undefined}
      aria-label='Select input method'
      onClick={props.onButtonClick}
    >
      Select
    </Button>
    </>
  )
}
