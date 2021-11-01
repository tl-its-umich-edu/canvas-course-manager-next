import React from 'react'
import { makeStyles, Typography, Link } from '@material-ui/core'
import allFeatures from '../models/FeatureUIData'

const useStyles = makeStyles((theme) => ({
  helpText: {
    marginLeft: 'auto',
    padding: '20px'
  }
}))

interface HelpLinkProps {
  pathName: string
  helpURL: string
}
function Help (props: HelpLinkProps): JSX.Element {
  const classes = useStyles()
  const { pathName, helpURL } = props
  const features = allFeatures.map(f => f.features).flat()
  let helppath = helpURL
  for (const f of features) {
    if (f.route.slice(1, f.route.length) === pathName) {
      helppath = helpURL + f.helpURL
    }
  }
  return (
    <Typography className={classes.helpText} ><Link href={helppath} target='_blank' rel="noopener">Need Help?</Link></Typography>
  )
}

export default Help
