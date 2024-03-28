import React, { useState } from 'react'
import { styled } from '@mui/material/styles'
import { Backdrop, Button, CircularProgress, Grid, Paper, Typography } from '@mui/material'

import APIErrorMessage from './APIErrorMessage'
import CanvasSettingsLink from './CanvasSettingsLink'
import ErrorAlert from './ErrorAlert'
import InlineErrorAlert from './InlineErrorAlert'
import RoleSelect from './RoleSelect'
import SectionSelectorWidget from './SectionSelectorWidget'
import SuccessCard from './SuccessCard'
import ValidatedFormField from './ValidatedFormField'
import * as api from '../api'
import usePromise from '../hooks/usePromise'
import { CanvasCourseSectionWithCourseName, CanvasUserCondensed, ClientEnrollmentType } from '../models/canvas'
import { AddExternalUserEnrollment, AddNewExternalUserEnrollment } from '../models/enrollment'
import { AddNonUMUsersLeafProps } from '../models/FeatureUIData'
import { APIErrorWithContext, CsrfToken } from '../models/models'
import { CanvasError, ExternalUserProcessError } from '../utils/handleErrors'
import {
  emailInputSchema, firstNameInputSchema, lastNameInputSchema, validateString, ValidationResult
} from '../utils/validation'

const PREFIX = 'UserEnrollmentForm'

const classes = {
  spacing: `${PREFIX}-spacing`,
  buttonGroup: `${PREFIX}-buttonGroup`,
  alert: `${PREFIX}-alert`,
  container: `${PREFIX}-container`,
  backdrop: `${PREFIX}-backdrop`
}

const Root = styled('div')((
  {
    theme
  }
) => ({
  [`& .${classes.spacing}`]: {
    marginBottom: theme.spacing(2)
  },

  [`& .${classes.buttonGroup}`]: {
    marginTop: theme.spacing(1)
  },

  [`& .${classes.alert}`]: {
    padding: theme.spacing(2)
  },

  [`& .${classes.container}`]: {
    position: 'relative',
    zIndex: 0
  },

  [`& .${classes.backdrop}`]: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#FFF',
    position: 'absolute',
    textAlign: 'center'
  }
}))

interface ExternalEnrollmentSummary {
  createdAndInvited: boolean
  enrolled: boolean
}

interface UserEnrollmentFormProps extends AddNonUMUsersLeafProps {
  csrfToken: CsrfToken
}

export default function UserEnrollmentForm (props: UserEnrollmentFormProps): JSX.Element {
  const [selectedSection, setSelectedSection] = useState<CanvasCourseSectionWithCourseName | undefined>(undefined)

  const [email, setEmail] = useState<string | undefined>(undefined)
  const [emailValidationResult, setEmailValidationResult] = useState<ValidationResult | undefined>(undefined)
  const [userInfo, setUserInfo] = useState<CanvasUserCondensed | null | undefined>(undefined)
  const [showIncompleteAlerts, setShowIncompleteAlerts] = useState<boolean>(false)

  const [firstName, setFirstName] = useState<string | undefined>(undefined)
  const [firstNameValidationResult, setFirstNameValidationResult] = useState<ValidationResult | undefined>(undefined)

  const [lastName, setLastName] = useState<string | undefined>(undefined)
  const [lastNameValidationResult, setLastNameValidationResult] = useState<ValidationResult | undefined>(undefined)
  const [role, setRole] = useState<ClientEnrollmentType | undefined>(undefined)

  const [successResult, setSuccessResult] = useState<ExternalEnrollmentSummary | undefined>(undefined)

  const [doSearchForUser, isSearchForUserLoading, searchForUserError, clearSearchForUserError] = usePromise(
    async (loginId: string): Promise<CanvasUserCondensed | null> => {
      return await api.getUserInfo(loginId)
    },
    (result: CanvasUserCondensed | null) => setUserInfo(result)
  )

  const [doAddEnrollment, isAddEnrollmentLoading, addEnrollmentError, clearAddEnrollmentError] = usePromise(
    async (sectionId: number, enrollment: AddExternalUserEnrollment) => await api.addSectionEnrollments(
      sectionId, [{ loginId: enrollment.email, role: enrollment.role }], props.csrfToken.token
    ),
    () => setSuccessResult({ createdAndInvited: false, enrolled: true })
  )

  const [
    doAddNewExternalEnrollment, isAddNewExternalEnrollmentLoading, addNewExternalEnrollmentError,
    clearAddNewExternalEnrollmentError
  ] = usePromise(
    async (sectionId: number, enrollment: AddNewExternalUserEnrollment): Promise<ExternalEnrollmentSummary> => {
      const { email, firstName, lastName, role } = enrollment
      const result = await api.createExternalUsers([{ email, givenName: firstName, surname: lastName }], props.csrfToken.token)
      let createdAndInvited = false
      if (result.length > 0 && result[0].userCreated) {
        createdAndInvited = true
        await api.addSectionEnrollments(sectionId, [{ loginId: email, role }], props.csrfToken.token)
      }
      return { createdAndInvited, enrolled: true }
    },
    (result: ExternalEnrollmentSummary) => setSuccessResult(result)
  )

  const errorsWithContext = [
    { error: props.getSectionsError, context: 'loading section data' },
    { error: searchForUserError, context: 'searching for the user' },
    { error: addEnrollmentError, context: 'enrolling the user in a section' }
  ].filter(d => d.error !== undefined) as APIErrorWithContext[]

  const isEnrollmentLoading = isAddEnrollmentLoading || isAddNewExternalEnrollmentLoading
  const isLoading = props.isGetSectionsLoading || isSearchForUserLoading || isEnrollmentLoading

  // Handlers

  const resetNameEntryState = (): void => {
    setUserInfo(undefined)
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

  const resetAll = async (): Promise<void> => {
    setEmail(undefined)
    setRole(undefined)
    setSelectedSection(undefined)
    resetNameEntryState()
    resetErrors()
    await props.doGetSections()
  }

  const handleSearchClick = async (): Promise<void> => {
    const result = validateString(email, emailInputSchema)
    setEmailValidationResult(result)
    if (!result.isValid || email === undefined) return
    return await doSearchForUser(email)
  }

  const handleSubmitClick = async (): Promise<void> => {
    if (
      userInfo === undefined ||
      (userInfo === null && firstName === undefined && lastName === undefined) ||
      role === undefined ||
      selectedSection === undefined
    ) {
      return setShowIncompleteAlerts(true)
    }
    setShowIncompleteAlerts(false)

    // Included to ensure types and as a precaution; userInfo depends on email being valid.
    if (email === undefined || emailValidationResult?.isValid !== true) return

    if (userInfo !== null) {
      return await doAddEnrollment(selectedSection.id, { email, role })
    }
    const firstNameResult = validateString(firstName, firstNameInputSchema)
    setFirstNameValidationResult(firstNameResult)
    const lastNameResult = validateString(lastName, lastNameInputSchema)
    setLastNameValidationResult(lastNameResult)
    if (
      firstName !== undefined &&
      firstNameResult.isValid &&
      lastName !== undefined &&
      lastNameResult.isValid
    ) {
      await doAddNewExternalEnrollment(selectedSection.id, { email, role, firstName, lastName })
    }
  }

  const emailField = (
    <div className={`${classes.spacing} ${classes.container}`}>
      <Typography className={classes.spacing}>
        Enter the user&apos;s non-UM email address, and click &quot;Search&quot; to see if they are in Canvas. (Required)
      </Typography>
      {
        showIncompleteAlerts && (userInfo === undefined) &&
          <InlineErrorAlert>You must search for the user to complete the form.</InlineErrorAlert>
      }
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
            disabled={isLoading}
          />
        </Grid>
        <Grid item md={2} sm={4} xs={4}>
          <Button
            color='primary'
            variant='contained'
            aria-label='Search for user in Canvas'
            onClick={handleSearchClick}
            disabled={isLoading}
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
            Searching for the user in Canvas
          </Grid>
        </Grid>
      </Backdrop>
    </div>
  )

  const nameInput = (
    <>
    {
      showIncompleteAlerts && (firstName === undefined || lastName === undefined) &&
        <InlineErrorAlert>You must enter a first name and last name.</InlineErrorAlert>
    }
    <Typography className={classes.spacing} gutterBottom>
      The email you entered is not associated with an account in Canvas.
      Please provide a first and last name, and we will send them an email invitation
      to set up a login method and add them to Canvas. (Required)
    </Typography>
    <Grid container spacing={2}>
      <Grid item md={6} xs={6}>
        <ValidatedFormField
          fieldName='First name'
          placeholder='Jane'
          value={firstName}
          validationResult={firstNameValidationResult}
          fullWidth={true}
          onChange={e => {
            setFirstNameValidationResult(undefined)
            setFirstName(e.currentTarget.value)
          }}
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
          onChange={e => {
            setLastNameValidationResult(undefined)
            setLastName(e.currentTarget.value)
          }}
          fullWidth={true}
          disabled={isAddNewExternalEnrollmentLoading}
        />
      </Grid>
    </Grid>
    </>
  )

  const renderForm = (): JSX.Element => {
    if (errorsWithContext.length > 0) {
      return <ErrorAlert messages={[<APIErrorMessage key={0} {...errorsWithContext[0]} />]} tryAgain={resetAll} />
    }

    if (addNewExternalEnrollmentError !== undefined) {
      if (addNewExternalEnrollmentError instanceof ExternalUserProcessError) {
        const descriptions = addNewExternalEnrollmentError.describeErrors()
        if (descriptions.length === 0) return <ErrorAlert />
        const { context, errorText, action } = descriptions[0]
        const messageBlock = [context, `Error message: "${errorText}"`, action].map((t, i) => <Typography key={i}>{t}</Typography>)
        return (<ErrorAlert messages={[<div key={0}>{messageBlock}</div>]} tryAgain={resetAll} />)
      } else {
        const context = addNewExternalEnrollmentError instanceof CanvasError
          ? 'enrolling the new user in a section'
          : 'adding the new non-UM user'
        return (
          <ErrorAlert
            messages={[<APIErrorMessage key={0} context={context} error={addNewExternalEnrollmentError} />]}
            tryAgain={resetAll}
          />
        )
      }
    }

    return (
      <div className={classes.container}>
        {emailField}
        {
          userInfo !== undefined && (
            <Paper className={`${classes.alert} ${classes.spacing}`} role='alert' variant='outlined'>
              {
                userInfo === null
                  ? nameInput
                  : (
                      <Typography>
                        This email is already associated with a Canvas user ({userInfo.name}).
                        Finish the form to enroll them in the section.
                      </Typography>
                    )
              }
            </Paper>
          )
        }
        <div className={classes.spacing}>
          {
            showIncompleteAlerts && role === undefined &&
              <InlineErrorAlert>You must select a Canvas role from the dropdown.</InlineErrorAlert>
          }
          <RoleSelect
            roles={props.rolesUserCanEnroll}
            selectedRole={role}
            onRoleChange={setRole}
            disabled={isLoading}
          />
        </div>
        <Typography className={classes.spacing}>
          Select the section you want to enroll the user in.
        </Typography>
        {
          showIncompleteAlerts && selectedSection === undefined &&
            <InlineErrorAlert>You must select one section from the list below.</InlineErrorAlert>
        }
        <div className={classes.container}>
          <SectionSelectorWidget
            height={300}
            search={[]}
            multiSelect={false}
            sections={props.sections}
            csrfToken={props.csrfToken}
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
          <Backdrop className={classes.backdrop} open={props.isGetSectionsLoading}>
            <Grid container>
              <Grid item xs={12}><CircularProgress color='inherit' /></Grid>
              <Grid item xs={12}>Loading section data from Canvas</Grid>
            </Grid>
          </Backdrop>
        </div>
        <Grid container className={classes.buttonGroup} justifyContent='space-between'>
          <Button
            variant='outlined'
            aria-label='Back to input method select'
            onClick={props.resetFeature}
          >
            Back
          </Button>
          <Button
            color='primary'
            variant='contained'
            disabled={isLoading}
            aria-label='Submit single user enrollment'
            onClick={handleSubmitClick}
          >
            Submit
          </Button>
        </Grid>
        <Backdrop className={classes.backdrop} open={isEnrollmentLoading}>
          <Grid container>
            <Grid item xs={12}>
              <CircularProgress color='inherit' />
            </Grid>
            <Grid item xs={12}>Sending user and enrollment data to Canvas</Grid>
          </Grid>
        </Backdrop>
      </div>
    )
  }

  const renderSuccess = (result: ExternalEnrollmentSummary): JSX.Element => {
    const messageText = (
      result.createdAndInvited
        ? 'The new user was added to Canvas, sent an email invitation to choose a login method, and'
        : 'The existing user was'

    ) + ' enrolled in the selected section!'
    const nextAction = (
      <span>See the user in the course&apos;s sections on the <CanvasSettingsLink url={props.settingsURL} /> for your course.</span>
    )

    return (
      <>
      <SuccessCard message={<Typography>{messageText}</Typography>} nextAction={nextAction} />
      <Grid container className={classes.buttonGroup} justifyContent='flex-start'>
        <Button variant='outlined' aria-label={`Start ${props.featureTitle} again`} onClick={props.resetFeature}>
          Start Again
        </Button>
      </Grid>
      </>
    )
  }

  return (
    <Root id='single-add-user'>
      <Typography variant='h6' component='h2' gutterBottom>Add Single User Manually</Typography>
      {successResult === undefined ? renderForm() : renderSuccess(successResult)}
    </Root>
  )
}
