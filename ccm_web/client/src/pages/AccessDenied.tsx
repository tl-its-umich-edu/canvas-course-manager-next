import React from 'react'

import InlineErrorAlert from '../components/InlineErrorAlert'

import { Link, makeStyles, Typography } from '@material-ui/core'

const useStyles = makeStyles((theme) => ({
  container: {
    margin: theme.spacing(2)
  }
}))

interface AccessDeniedProps {
  forHelpLink: string
}

export default function AccessDenied (props: AccessDeniedProps): JSX.Element {
  const classes = useStyles()
  const emailLink = (
    <Link style={{ textDecoration: 'underline' }} href={props.forHelpLink} target='_blank' rel='noopener'>
      4help@umich.edu
    </Link>
  )
  return (
    <div className={classes.container}>
      <InlineErrorAlert>
      <Typography>
        To use Canvas Course Manager you must have a course management role in this course.
      </Typography>
      <Typography>
        If you believe this message is in error, please contact {emailLink}.
      </Typography>
      </InlineErrorAlert>
    </div>
  )
}
