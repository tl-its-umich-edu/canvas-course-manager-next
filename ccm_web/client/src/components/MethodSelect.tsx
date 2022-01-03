import React from 'react'
import {
  Button, FormControl, FormControlLabel, FormLabel, makeStyles, Radio, RadioGroup
} from '@material-ui/core'

interface Option<T extends string> {
  key: T
  label: string
}

interface MethodSelectProps<T extends string> {
  options: Array<Option<T>>
  label: string
  selectedMethod: T
  typeGuard: (v: string) => v is T
  setMethod: (method: T) => void
  onButtonClick: () => void
  disabled: boolean | undefined
}

const useStyles = makeStyles((theme) => ({
  spacing: {
    marginBottom: theme.spacing(2)
  }
}))

export default function UserInputMethodSelect<T extends string> (props: MethodSelectProps<T>): JSX.Element {
  const classes = useStyles()

  const handleChange = (e: React.ChangeEvent<{ name?: string, value: unknown }>): void => {
    const value = e.target.value
    if (typeof value === 'string' && props.typeGuard(value)) {
      props.setMethod(value)
    }
  }

  return (
    <>
    <div className={classes.spacing}>
      <FormControl component='fieldset'>
        <FormLabel required className={classes.spacing}>{props.label}</FormLabel>
        <RadioGroup
          aria-label='Input method'
          value={props.selectedMethod}
          name='radio-buttons-group'
          onChange={handleChange}
        >
          {
            props.options.map((o, i) => {
              return (
                <FormControlLabel
                  key={i}
                  value={o.key}
                  control={<Radio color='primary' disabled={props.disabled} />}
                  label={o.label}
                />
              )
            })
          }
        </RadioGroup>
      </FormControl>
    </div>
    <Button
      color='primary'
      variant='contained'
      disabled={props.disabled}
      aria-label='Select method'
      onClick={props.onButtonClick}
    >
      Select
    </Button>
    </>
  )
}
