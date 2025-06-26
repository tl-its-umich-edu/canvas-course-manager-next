import React from 'react'
import { styled } from '@mui/material/styles'
import { Button, Grid, Link, Typography } from '@mui/material'

import { CCMComponentProps } from '../models/FeatureUIData.js'

const PREFIX = 'GBCanvasReplacementNotice'

const classes = {
  root: `${PREFIX}-root`,
  buttonGroup: `${PREFIX}-buttonGroup`
}

const Root = styled('div')((
  {
    theme
  }
) => ({
  [`&.${classes.root}`]: {
    textAlign: 'left'
  },

  [`& .${classes.buttonGroup}`]: {
    marginTop: theme.spacing(1)
  }
}))

function GBCanvasReplacementNotice (props: CCMComponentProps): JSX.Element {
  return (
    <Root className={classes.root}>
      <Typography variant='h5' component='h1'>{props.title}</Typography>
      <div>
        <Typography variant='h6' component='h2' sx={{ mb: 2 }}>
          <b>This feature has been replaced by Canvas Letter Grades Import</b>
        </Typography>
        <Typography paragraph>
          <strong>Canvas Letter Grades Import</strong> is a tool located directly in the <Link href="https://wolverineaccess.umich.edu/">Faculty Center's Grade Roster.</Link>
        </Typography>
        <Typography paragraph>
          You must format final grades in Canvas as letter grades (via the grading scheme) to use Canvas Letter Grades Import.
        </Typography>
        <Typography variant='h6' component='h3' sx={{ mt: 3, mb: 1 }}>
          Get Started
        </Typography>
         <ol>
          <li>
            <Typography>
              <Link href='https://teamdynamix.umich.edu/TDClient/30/Portal/KB/ArticleDet?ID=7257' target='_blank' rel="noopener">
                Prep your Canvas Gradebook
              </Link>
            </Typography>
          </li>
          <li>
            <Typography>
              <Link href='https://teamdynamix.umich.edu/TDClient/30/Portal/KB/ArticleDet?ID=11669' target='_blank' rel="noopener">
                Import grades using Canvas Letter Grades Import in Grade Roster
              </Link>
            </Typography>
          </li>
        </ol>
      </div>
    </Root>
  )
}

export default GBCanvasReplacementNotice
