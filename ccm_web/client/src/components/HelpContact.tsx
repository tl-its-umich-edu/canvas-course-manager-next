import React from 'react'
import { Link, Typography } from '@mui/material'

export interface HelpContactProps {
  email: string
  helpLink: string
}

export default function HelpContact (props: HelpContactProps): JSX.Element {
  const emailLink = <Link href={`mailto:${props.email}`}>{props.email}</Link>
  const forHelpLink = (
    <Link href={props.helpLink} target='_blank' rel='noopener'>
      ITS Help Page
    </Link>
  )

  return (
    <Typography>
      If you believe this message is in error, please contact {emailLink} or visit the {forHelpLink}.
    </Typography>
  )
}
