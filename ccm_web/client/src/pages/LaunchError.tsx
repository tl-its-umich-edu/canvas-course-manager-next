import React from 'react'

import { Typography } from '@material-ui/core'

import HelpContact, { HelpContactProps } from '../components/HelpContact'
import InlineErrorAlert from '../components/InlineErrorAlert'
import Layout from '../components/Layout'

interface LaunchErrorProps extends HelpContactProps {}

export default function LaunchError (props: LaunchErrorProps): JSX.Element {
  return (
    <Layout>
      <InlineErrorAlert>
        <Typography variant='subtitle1' component='h1'>Launch Error</Typography>
        <Typography>
          The tool could not be launched. It is likely your browser is blocking third-party cookies,
          which are required for this application.
        </Typography>
        <HelpContact {...props} />
      </InlineErrorAlert>
    </Layout>
  )
}
