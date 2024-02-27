import React from 'react'
import { styled } from '@mui/material/styles'
import { Grid, MenuItem, Select, SelectChangeEvent, Typography } from '@mui/material'

import { ClientEnrollmentType } from '../models/canvas'

const PREFIX = 'RoleSelect'

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

interface RoleSelectProps {
  roles: ClientEnrollmentType[]
  selectedRole: ClientEnrollmentType | undefined
  onRoleChange: (role: ClientEnrollmentType) => void
  disabled: boolean | undefined
}

export default function RoleSelect (props: RoleSelectProps): JSX.Element {
  const handleRoleSelectChange = (event: SelectChangeEvent): void => {
    const value = event.target.value
    if (typeof value === 'string' && Object.values<string>(ClientEnrollmentType).includes(value)) {
      props.onRoleChange(value as ClientEnrollmentType)
    }
  }

  return (
    (<Root>
      <Typography id='role-select-label' className={classes.spacing}>
        Select a Canvas role that the user will have in the section.
        The available roles are determined by your own role(s) in the course. (Required)
      </Typography>
      <Grid container>
        <Grid item xs={8} sm={6}>
          <Select
            fullWidth={true}
            variant='outlined'
            id='role-select'
            labelId='role-select-label'
            value={props.selectedRole ?? ''}
            onChange={handleRoleSelectChange}
            disabled={props.disabled}
          >
            {props.roles.map((r, i) => <MenuItem key={i} value={r}>{r.toLowerCase()}</MenuItem>)}
          </Select>
        </Grid>
      </Grid>
    </Root>)
  )
}
