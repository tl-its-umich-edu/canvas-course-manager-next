import React from 'react'
import { makeStyles, Typography, Link } from '@material-ui/core'
import { FeatureUIProps } from '../models/FeatureUIData'

const useStyles = makeStyles((theme) => ({
  helpText: {
    marginLeft: 'auto',
    padding: '20px'
  }
}))

interface HelpLinkProps {
  pathnames: string[]
  features: FeatureUIProps[]
  baseHelpURL: string
}

function Help (props: HelpLinkProps): JSX.Element {
  const classes = useStyles()
  const { features, pathnames, baseHelpURL } = props
  let helpURLEnding = baseHelpURL
  for (const feature of features) {
    if (`/${pathnames[0]}`.includes(feature.route)) {
      helpURLEnding += feature.data.helpURLEnding
    }
  }
  return (
    <Typography className={classes.helpText} ><Link href={helpURLEnding} target='_blank' rel="noopener">Need Help?</Link></Typography>
  )
}

export default Help
