import React, { useState } from 'react'
import { Backdrop, Button, CircularProgress, Grid, Link, makeStyles, Paper, Typography } from '@material-ui/core'

import ErrorAlert from './ErrorAlert'
import RoleSelect from './RoleSelect'
import SectionSelectorWidget, { SelectableCanvasCourseSection } from './SectionSelectorWidget'
import SuccessCard from './SuccessCard'
import ValidatedFormField from './ValidatedFormField'
import * as api from '../api'
import usePromise from '../hooks/usePromise'
import { ClientEnrollmentType, getCanvasRole } from '../models/canvas'
import { AddExternalUserEnrollment, AddNewExternalUserEnrollment } from '../models/enrollment'
import { emailSchema, firstNameSchema, lastNameSchema, validateString, ValidationResult } from '../utils/validation'

interface UserEnrollmentFormProps {
  readonly rolesUserCanEnroll: ClientEnrollmentType[]
  sections: SelectableCanvasCourseSection[]
  resetFeature: () => void
  settingsURL: string
}

const useStyles = makeStyles((theme) => ({
  spacing: {
    marginBottom: theme.spacing(2)
  },
  buttonGroup: {
    marginTop: theme.spacing(1)
  },
  alert: {
    padding: theme.spacing(2)
  },
  container: {
    position: 'relative',
    zIndex: 0
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#FFF',
    position: 'absolute',
    textAlign: 'center'
  }
}))

export default function UserEnrollmentForm (props: UserEnrollmentFormProps): JSX.Element {
  const classes = useStyles()

  const [selectedSection, setSelectedSection] = useState<SelectableCanvasCourseSection | undefined>(undefined)

  const [email, setEmail] = useState<string | undefined>(undefined)
  const [emailValidationResult, setEmailValidationResult] = useState<ValidationResult | undefined>(undefined)
  const [userExists, setUserExists] = useState<boolean | undefined>(undefined)

  const [firstName, setFirstName] = useState<string | undefined>(undefined)
  const [firstNameValidationResult, setFirstNameValidationResult] = useState<ValidationResult | undefined>(undefined)

  const [lastName, setLastName] = useState<string | undefined>(undefined)
  const [lastNameValidationResult, setLastNameValidationResult] = useState<ValidationResult | undefined>(undefined)
  const [role, setRole] = useState<ClientEnrollmentType | undefined>(undefined)

  const [success, setSuccess] = useState<true | undefined>(undefined)

  const [doSearchForUser, isSearchForUserLoading, searchForUserError, clearSearchForUserError] = usePromise(
    async (loginId: string): Promise<boolean> => {
      const promise = new Promise(resolve => setTimeout(resolve, 2000)) // Mocking this for now
      await promise
      return false
    },
    (result: boolean) => setUserExists(result)
  )

  const [doAddEnrollment, isAddEnrollmentLoading, addEnrollmentError, clearAddEnrollmentError] = usePromise(
    async (sectionId: number, enrollment: AddExternalUserEnrollment) => await api.addSectionEnrollments(
      sectionId, [{ loginId: enrollment.email, type: getCanvasRole(enrollment.role) }]
    ),
    () => setSuccess(true)
  )

  const [
    doAddNewExternalEnrollment, isAddNewExternalEnrollmentLoading, addNewExternalEnrollmentError,
    clearAddNewExternalEnrollmentError
  ] = usePromise(
    async (sectionId: number, enrollment: AddNewExternalUserEnrollment) => {
      const promise = new Promise(resolve => setTimeout(resolve, 2000)) // Mocking this for now
      return await promise
    },
    () => setSuccess(true)
  )

  const isEnrollmentLoading = isAddEnrollmentLoading || isAddNewExternalEnrollmentLoading

  const roleAndSectionComplete = role !== undefined && selectedSection !== undefined
  const userExistsComplete = email !== undefined && userExists === true && roleAndSectionComplete
  const userDoesNotExistComplete = (
    email !== undefined &&
    userExists === false &&
    firstName !== undefined &&
    lastName !== undefined &&
    roleAndSectionComplete
  )
  const isFormComplete = userExistsComplete || userDoesNotExistComplete

  // Handlers

  const resetNameEntryState = (): void => {
    setUserExists(undefined)
    setFirstName(undefined)
    setLastName(undefined)
    setEmailValidationResult(undefined)
    setFirstNameValidationResult(undefined)
    setLastNameValidationResult(undefined)
  }

  const resetErrors = (): void => {
    clearSearchForUserError()
    clearAddEnrollmentError()
    clearAddNewExternalEnrollmentError()
  }

  const resetAll = (): void => {
    setEmail(undefined)
    setRole(undefined)
    setSelectedSection(undefined)
    resetNameEntryState()
    resetErrors()
  }

  const handleSearchClick = async (): Promise<void> => {
    const result = validateString(email, emailSchema)
    setEmailValidationResult(result)
    if (!result.isValid || email === undefined) return
    return await doSearchForUser(email)
  }

  const handleSubmitClick = async (): Promise<void> => {
    if (email === undefined || userExists === undefined) return

    const sectionAndRoleComplete = selectedSection !== undefined && role !== undefined
    if (userExists && sectionAndRoleComplete) {
      return await doAddEnrollment(selectedSection.id, { email, role })
    }
    const firstNameResult = validateString(firstName, firstNameSchema)
    setFirstNameValidationResult(firstNameResult)
    const lastNameResult = validateString(lastName, lastNameSchema)
    setLastNameValidationResult(lastNameResult)
    if (
      emailValidationResult?.isValid === true &&
      firstName !== undefined &&
      firstNameResult.isValid &&
      lastName !== undefined &&
      lastNameResult.isValid &&
      sectionAndRoleComplete
    ) {
      await doAddNewExternalEnrollment(selectedSection.id, { email, role, firstName, lastName })
    }
  }

  const emailField = (
    <div className={`${classes.spacing} ${classes.container}`}>
      <Typography className={classes.spacing}>
        Enter the user&apos;s non-UM email address, and click &quot;Search&quot; to see if they are in Canvas.
      </Typography>
      <Grid container spacing={2} alignItems='center'>
        <Grid item md={10} sm={8} xs={8}>
          <ValidatedFormField
            fieldName='Email address'
            placeholder='user@example.com'
            value={email}
            validationResult={emailValidationResult}
            onChange={e => {
              resetNameEntryState()
              setEmail(e.currentTarget.value)
            }}
            fullWidth={true}
            disabled={isSearchForUserLoading || isAddEnrollmentLoading || isAddNewExternalEnrollmentLoading}
          />
        </Grid>
        <Grid item md={2} sm={4} xs={4}>
          <Button
            color='primary'
            variant='contained'
            aria-label='Search for user in Canvas'
            onClick={handleSearchClick}
            disabled={email === undefined || userExists !== undefined}
          >
            Search
          </Button>
        </Grid>
      </Grid>
      <Backdrop className={classes.backdrop} open={isSearchForUserLoading}>
        <Grid container>
          <Grid item xs={12}>
            <CircularProgress color='inherit' />
          </Grid>
          <Grid item xs={12}>
            Loading section data from Canvas
          </Grid>
        </Grid>
      </Backdrop>
    </div>
  )

  const nameInput = (
    <>
    <Typography className={classes.spacing} gutterBottom>
      The email you entered is not associated with an account in Canvas.
      Please provide a first and last name, and we will invite them to set up a friend account.
    </Typography>
    <Grid container spacing={2}>
      <Grid item md={6} xs={6}>
        <ValidatedFormField
          fieldName='First name'
          placeholder='Jane'
          value={firstName}
          validationResult={firstNameValidationResult}
          fullWidth={true}
          onChange={e => setFirstName(e.currentTarget.value)}
          disabled={isAddNewExternalEnrollmentLoading}
          autoFocus={true}
        />
      </Grid>
      <Grid item md={6} xs={6}>
        <ValidatedFormField
          fieldName='Last name'
          placeholder='Doe'
          value={lastName}
          validationResult={lastNameValidationResult}
          onChange={e => setLastName(e.currentTarget.value)}
          fullWidth={true}
          disabled={isAddNewExternalEnrollmentLoading}
        />
      </Grid>
    </Grid>
    </>
  )

  const renderForm = (): JSX.Element => {
    if (
      searchForUserError !== undefined ||
      addEnrollmentError !== undefined ||
      addNewExternalEnrollmentError !== undefined
    ) {
      return (
        <ErrorAlert
          messages={[
            <Typography key={0}>
              An error occurred while
              {searchForUserError !== undefined && ' searching for the user in'}
              {addEnrollmentError !== undefined && ' enrolling the user in a section in '}
              {addNewExternalEnrollmentError !== undefined && ' adding the new external user to '}
              Canvas.
            </Typography>
          ]}
          tryAgain={resetAll}
        />
      )
    }

    return (
      <Grid container className={classes.container}>
        <Grid item xs={12} sm={9} md={9}>
          {emailField}
          {
            userExists !== undefined && (
              <Paper className={`${classes.alert} ${classes.spacing}`} role='alert' variant='outlined'>
                {
                  !userExists
                    ? nameInput
                    : (
                        <Typography>
                          This email is already associated with a Canvas user.
                          Finish the form to enroll them in the section.
                        </Typography>
                      )
                }
              </Paper>
            )
          }
          <div className={classes.spacing}>
            <RoleSelect
              selectedRole={role}
              posRoles={props.rolesUserCanEnroll}
              onRoleChange={(role) => setRole(role)}
              disabled={isEnrollmentLoading}
            />
          </div>
          <Typography gutterBottom>
            Select the section you want to enroll the user in.
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
          <Grid container className={classes.buttonGroup} justifyContent='space-between'>
            <Button
              aria-label='Back to input method select'
              onClick={props.resetFeature}
            >
              Back
            </Button>
            <Button
              color='primary'
              variant='contained'
              disabled={!isFormComplete || isEnrollmentLoading}
              aria-label='Submit single user enrollment'
              onClick={handleSubmitClick}
            >
              Submit
            </Button>
          </Grid>
        </Grid>
        <Backdrop className={classes.backdrop} open={isEnrollmentLoading}>
          <Grid container>
            <Grid item xs={12}>
              <CircularProgress color='inherit' />
            </Grid>
            <Grid item xs={12}>Sending user and enrollment data to Canvas</Grid>
          </Grid>
        </Backdrop>
      </Grid>
    )
  }

  const renderSuccess = (userExists: boolean): JSX.Element => {
    const settingsLink = (
      <Link href={props.settingsURL} target='_parent'>Canvas Settings page</Link>
    )
    const messageText = (
      userExists
        ? 'The existing user was'
        : 'The new user was invited to create a friend account, added to Canvas, and'
    ) + ' enrolled in the selected section!'
    const nextAction = (
      <span>See the user in the course&apos;s sections on the {settingsLink} for your course.</span>
    )

    return (
      <>
      <SuccessCard message={<Typography>{messageText}</Typography>} nextAction={nextAction} />
      <Grid container className={classes.buttonGroup} justifyContent='flex-start'>
        <Button variant='outlined' onClick={props.resetFeature}>Start Again</Button>
      </Grid>
      </>
    )
  }

  return (
    <div id='single-add-user' aria-live='polite'>
      {success !== true || userExists === undefined ? renderForm() : renderSuccess(userExists)}
    </div>
  )
}
