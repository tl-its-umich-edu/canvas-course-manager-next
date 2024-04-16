import React from 'react'
import { Typography } from '@mui/material'

import HelpContact, { HelpContactProps } from '../components/HelpContact.js'
import InlineErrorAlert from '../components/InlineErrorAlert.js'
import Layout from '../components/Layout.js'

interface AccessDeniedProps extends HelpContactProps {}

export default function AccessDenied (props: AccessDeniedProps): JSX.Element {
  return (
    <Layout>
      <InlineErrorAlert>
        <Typography variant='subtitle1' component='h1'>Access Denied</Typography>
        <Typography>
          To use Canvas Course Manager, you must launch the tool from a Canvas course in which you have a course management role.
        </Typography>
        <HelpContact {...props} />
      </InlineErrorAlert>
    </Layout>
  )
}
