import React from 'react'

import InlineErrorAlert from '../components/InlineErrorAlert'

import { Link, makeStyles, Typography } from '@material-ui/core'

const useStyles = makeStyles((theme) => ({
  container: {
    margin: theme.spacing(2)
  },
  link: {
    textDecoration: 'underline'
  }
}))

interface AccessDeniedProps {
  email: string
  helpLink: string
}

export default function AccessDenied (props: AccessDeniedProps): JSX.Element {
  const classes = useStyles()
  const emailLink = <Link className={classes.link} href={`mailto:${props.email}`}>{props.email}</Link>
  const forHelpLink = (
    <Link className={classes.link} href={props.helpLink} target='_blank' rel='noopener'>
      ITS Help Page
    </Link>
  )

  return (
    <div className={classes.container}>
      <InlineErrorAlert>
        <Typography variant='subtitle1' component='h1'>Access Denied</Typography>
        <Typography>
          To use Canvas Course Manager, you must launch the tool from a Canvas course in which you have a course management role.
        </Typography>
        <Typography>
          If you believe this message is in error, please contact {emailLink} or visit the {forHelpLink}.
        </Typography>
      </InlineErrorAlert>
    </div>
  )
}
