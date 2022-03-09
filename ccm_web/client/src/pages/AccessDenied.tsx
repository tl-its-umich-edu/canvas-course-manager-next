import React from 'react'
import { Typography } from '@material-ui/core'

import HelpContact, { HelpContactProps } from '../components/HelpContact'
import InlineErrorAlert from '../components/InlineErrorAlert'
import Layout from '../components/Layout'

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
