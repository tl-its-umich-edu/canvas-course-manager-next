import React, { useState } from 'react'
import {
  Button, Grid, makeStyles, TextField, Typography
} from '@material-ui/core'

import RoleSelect from './RoleSelect'
import SectionSelectorWidget, { SelectableCanvasCourseSection } from './SectionSelectorWidget'
import usePromise from '../hooks/usePromise'
import { ClientEnrollmentType } from '../models/canvas'

interface ExternalUserEnrollment {
  email: string
  role: ClientEnrollmentType
}

interface ExternalUserNewEnrollment extends ExternalUserEnrollment {
  firstName: string
  lastName: string
}

interface UserEnrollmentFormProps {
  readonly rolesUserCanAdd: ClientEnrollmentType[]
  sections: SelectableCanvasCourseSection[]
  enrollExistingUser: (enrollment: ExternalUserEnrollment) => Promise<void>
  enrollNewUser: (enrollment: ExternalUserNewEnrollment) => Promise<void>
}

const useStyles = makeStyles((theme) => ({
  spacing: {
    marginBottom: theme.spacing(2)
  }
}))

type TextChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>

export default function UserEnrollmentForm (props: UserEnrollmentFormProps): JSX.Element {
  const classes = useStyles()

  const [selectedSection, setSelectedSection] = useState<SelectableCanvasCourseSection | undefined>(undefined)

  const [email, setEmail] = useState<string | undefined>(undefined)
  const [userExists, setUserExists] = useState<boolean | undefined>(undefined)

  const [firstName, setFirstName] = useState<string | undefined>('')
  const [lastName, setLastName] = useState<string | undefined>('')
  const [role, setRole] = useState<ClientEnrollmentType | undefined>(undefined)

  const [doSearchForUser, isSearchForUserLoading, SearchForUserError] = usePromise(
    // Mocking this for now
    async (loginId: string): Promise<boolean> => false,
    (result: boolean) => setUserExists(result)
  )

  const isValid = ![firstName, lastName, email, role].includes(undefined)

  const nameInput = (
    <div>
      <Typography className={classes.spacing}>
        The email you entered is not associated with an account in Canvas.
        Please provide a first and last name, and we will invite them to set up a friend account.
      </Typography>
      <TextField
        fullWidth
        className={classes.spacing}
        variant='filled'
        label='First name'
        placeholder='Jane'
        onChange={(e: TextChangeEvent) => setFirstName(e.currentTarget.value)}
      />
      <TextField
        fullWidth
        className={classes.spacing}
        variant='filled'
        label='Last name'
        placeholder='Doe'
        onChange={(e: TextChangeEvent) => setLastName(e.currentTarget.value)}
      />
    </div>
  )

  const emailField = (
    <Grid container spacing={2} alignItems='center'>
      <Grid item md={10} sm={8} xs={8}>
        <TextField
          className={classes.spacing}
          fullWidth
          label='Email address'
          placeholder='user@example.com'
          onChange={(e: TextChangeEvent) => {
            setUserExists(undefined)
            setFirstName(undefined)
            setLastName(undefined)
            setEmail(e.currentTarget.value)
          }}
          disabled={isSearchForUserLoading}
        />
      </Grid>
      <Grid item md={2} sm={4} xs={4}>
        <Button
          color='primary'
          variant='contained'
          aria-label='Search for user in Canvas'
          onClick={async () => { if (email !== undefined) await doSearchForUser(email) }}
          disabled={email === undefined || userExists !== undefined}
        >
          Search
        </Button>
      </Grid>
    </Grid>
  )

  return (
    <div id='single-add-user' aria-live='polite'>
      <Grid container>
        <Grid item xs={12} sm={9} md={9}>
          <Typography>
            Enter the user&apos;s non-UM email address, and click &quot;Search&quot; to see if they are in Canvas.
          </Typography>
          {emailField}
          {userExists === false && nameInput}
          <div className={classes.spacing}>
            <RoleSelect
              selectedRole={role}
              posRoles={props.rolesUserCanAdd}
              onRoleChange={(role) => setRole(role)}
              disabled={undefined}
            />
          </div>
          <Typography gutterBottom>
            Select the section you want to enroll users in.
          </Typography>
          <div className={classes.spacing}>
            <SectionSelectorWidget
              height={300}
              search={[]}
              multiSelect={false}
              sections={props.sections}
              selectedSections={selectedSection !== undefined ? [selectedSection] : []}
              selectionUpdated={(sections) => {
                if (sections.length === 0) {
                  setSelectedSection(undefined)
                } else {
                  setSelectedSection(sections[0])
                }
              }}
              canUnmerge={false}
            />
          </div>
          <Button
            color='primary'
            variant='contained'
            disabled={!isValid}
            aria-label='Submit single user enrollment'
            onClick={undefined}
          >
            Submit
          </Button>
        </Grid>
      </Grid>
    </div>
  )
}
