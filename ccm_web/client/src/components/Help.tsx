import React, { useContext } from 'react'
import { styled } from '@mui/material/styles'
import { Typography, Link } from '@mui/material'
import { AnalyticsConsentContext } from '../context/AnalyticsConsentContext.js'
import { useGoogleAnalytics } from '../hooks/useGoogleAnalytics.js'

const PREFIX = 'Help'

const classes = {
  helpText: `${PREFIX}-helpText`
}

const StyledTypography = styled(Typography)((
  {
    theme
  }
) => ({
  [`&.${classes.helpText}`]: {
    float: 'right'
  }
}))

interface HelpLinkAnalyticsParams {
  help_url: string;
  page_context?: string;
}

interface HelpLinkProps {
  baseHelpURL: string
  helpURLEnding?: string
}

function Help (props: HelpLinkProps): JSX.Element {
  const analyticsConsentContext = useContext(AnalyticsConsentContext);
  const { sendAnalyticsEvent } = useGoogleAnalytics<HelpLinkAnalyticsParams>(analyticsConsentContext);
  
  const fullURL = props.baseHelpURL + (props.helpURLEnding ?? '')
  
  const handleHelpClick = () => {
    sendAnalyticsEvent('Help Link Clicked', {
      help_url: fullURL,
      page_context: props.helpURLEnding || 'general'
    });
  };
  
  return (
    <StyledTypography className={classes.helpText}>
      <Link href={fullURL} target='_blank' rel="noopener" onClick={handleHelpClick}>
        Need Help?
      </Link>
    </StyledTypography>
  )
}

export default Help
