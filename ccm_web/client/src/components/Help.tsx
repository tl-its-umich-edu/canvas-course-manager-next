import React from 'react'
import { makeStyles, Typography, Link } from '@material-ui/core'

const useStyles = makeStyles((theme) => ({
  helpText: {
    float: 'right'
  },
  helpLink: {
    textDecoration: 'underline'
  }
}))

interface HelpLinkProps {
  baseHelpURL: string
  helpURLEnding?: string
}

function Help (props: HelpLinkProps): JSX.Element {
  const classes = useStyles()
  const fullURL = props.baseHelpURL + (props.helpURLEnding ?? '')
  return (
    <Typography className={classes.helpText} ><Link className={classes.helpLink} href={fullURL} target='_blank' rel="noopener">Need Help?</Link></Typography>
  )
}

export default Help
