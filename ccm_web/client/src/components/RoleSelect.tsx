import React from 'react'
import { Grid, makeStyles, MenuItem, Select, Typography } from '@material-ui/core'

import { ClientEnrollmentType } from '../models/canvas'

const useStyles = makeStyles((theme) => ({
  spacing: {
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
  const classes = useStyles()
  const handleRoleSelectChange = (event: React.ChangeEvent<{ value: unknown }>): void => {
    const value = event.target.value
    if (typeof value === 'string' && Object.values<string>(ClientEnrollmentType).includes(value)) {
      props.onRoleChange(value as ClientEnrollmentType)
    }
  }

  return (
    <>
    <Typography id='role-select-label' className={classes.spacing}>
      Select a Canvas role that the user will have in the section.
      The available roles are determined by your own role(s) in the course.
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
    </>
  )
}
