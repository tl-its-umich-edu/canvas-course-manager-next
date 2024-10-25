import React from 'react'

import { Link, Typography } from '@mui/material'

import HelpContact, { HelpContactProps } from '../components/HelpContact.js'
import InlineErrorAlert from '../components/InlineErrorAlert.js'
import Layout from '../components/Layout.js'

interface LaunchErrorProps extends HelpContactProps {}

export default function LaunchError (props: LaunchErrorProps): JSX.Element {
  const chromeLink = 'https://support.google.com/chrome/answer/95647?hl=en'
  const macOSLink = 'https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/12.0/mac/10.14'
  const iOSLink = 'https://www.whatismybrowser.com/guides/how-to-enable-cookies/safari-iphone'
  const firefoxLink = 'https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop?redirectslug=enable-and-disable-cookies-website-preferences'
  const edgeLink = 'https://www.whatismybrowser.com/guides/how-to-enable-cookies/edge'
  const safariLink = 'https://support.apple.com/guide/safari/prevent-cross-site-tracking-sfri40732/mac'

  return (
    <Layout>
      <InlineErrorAlert>
        <Typography variant='subtitle1' component='h1'>Launch Error</Typography>
        <Typography>
          The tool could not be launched. It is likely your browser is blocking third-party cookies,
          which are required for this application.
        </Typography>
        <Typography>
          To resolve this issue, please update your settings
          for <Link href={chromeLink} target='_blank' rel="noopener">Chrome</Link>, <Link href={macOSLink} target='_blank' rel="noopener">Safari for MacOS</Link>
          , <Link href={iOSLink} target='_blank' rel="noopener">Safari for iOS</Link>, <Link href={firefoxLink} target='_blank' rel="noopener">Firefox</Link>
          , <Link href={edgeLink} target='_blank' rel="noopener">Microsoft Edge</Link>,
          or another preferred browser to allow third-party cookies.
          Safari should also <Link href={safariLink} target='_blank' rel="noopener">allow cross-site tracking.</Link>
        </Typography>
        <HelpContact {...props} />
      </InlineErrorAlert>
    </Layout>
  )
}
