import React from 'react'
import { Grid, MenuItem, Select, Typography } from '@material-ui/core'

import { ClientEnrollmentType } from '../models/canvas'

interface RoleSelectProps {
  disabled: boolean | undefined
  posRoles: ClientEnrollmentType[]
  selectedRole: ClientEnrollmentType | undefined
  onRoleChange: (role: ClientEnrollmentType) => void
}

export default function RoleSelect (props: RoleSelectProps): JSX.Element {
  const handleRoleSelectChange = (event: React.ChangeEvent<{ value: unknown }>): void => {
    const value = event.target.value
    if (typeof value === 'string' && Object.values<string>(ClientEnrollmentType).includes(value)) {
      props.onRoleChange(value as ClientEnrollmentType)
    }
  }

  return (
    <>
    <Typography gutterBottom id='role-select-label'>
      Select a Canvas role that the user will have the section.
      Only roles less privileged than your own are allowed.
    </Typography>
    <Grid container>
      <Grid item xs={8} sm={6}>
        <Select
          fullWidth={true}
          variant='filled'
          id='role-select'
          label='Role'
          labelId='role-select-label'
          value={props.selectedRole ?? ''}
          onChange={handleRoleSelectChange}
          disabled={props.disabled}
        >
          {props.posRoles.map((r, i) => <MenuItem key={i} value={r}>{r.toLowerCase()}</MenuItem>)}
        </Select>
      </Grid>
    </Grid>
    </>
  )
}
