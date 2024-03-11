import React from 'react'
import { styled } from '@mui/material/styles'
import { Typography, Link } from '@mui/material'

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

interface HelpLinkProps {
  baseHelpURL: string
  helpURLEnding?: string
}

function Help (props: HelpLinkProps): JSX.Element {
  const fullURL = props.baseHelpURL + (props.helpURLEnding ?? '')
  return <StyledTypography className={classes.helpText} ><Link href={fullURL} target='_blank' rel="noopener">Need Help?</Link></StyledTypography>
}

export default Help
