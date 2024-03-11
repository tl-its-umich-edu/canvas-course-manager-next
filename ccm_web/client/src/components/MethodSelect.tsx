import React from 'react'
import { styled } from '@mui/material/styles'
import { Button, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from '@mui/material'

const PREFIX = 'MethodSelect'

const classes = {
  spacing: `${PREFIX}-spacing`
}

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled('div')((
  {
    theme
  }
) => ({
  [`& .${classes.spacing}`]: {
    marginBottom: theme.spacing(2)
  }
}))

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
  onButtonClick: () => void | Promise<void>
  disabled?: boolean
}

export default function UserInputMethodSelect<T extends string> (props: MethodSelectProps<T>): JSX.Element {
  const handleChange = (e: React.ChangeEvent<{ name?: string, value: unknown }>): void => {
    const value = e.target.value
    if (typeof value === 'string' && props.typeGuard(value)) {
      props.setMethod(value)
    }
  }

  return (
    (<Root>
      <div className={classes.spacing}>
        <FormControl component='fieldset'>
          <FormLabel className={classes.spacing}>{props.label} (Required)</FormLabel>
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
    </Root>)
  )
}
