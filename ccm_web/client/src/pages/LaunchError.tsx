import React from 'react'

import { Typography } from '@material-ui/core'

import InlineErrorAlert from '../components/InlineErrorAlert'
import Layout from '../components/Layout'

export default function LaunchError (): JSX.Element {
  return (
    <Layout>
      <InlineErrorAlert>
        <Typography variant='subtitle1' component='h1'>Launch Error</Typography>
        <Typography>
          The tool could not be launched. This is likely due to settings related to cookies on your Internet browser.
        </Typography>
      </InlineErrorAlert>
    </Layout>
  )
}
