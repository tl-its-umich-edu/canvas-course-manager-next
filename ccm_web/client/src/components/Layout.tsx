import React from 'react'
import { Grid, Link, makeStyles, Typography } from '@material-ui/core'

import Breadcrumbs, { BreadcrumbsProps } from './Breadcrumbs'
import ResponsiveHelper from './ResponsiveHelper'
import { getCSRFToken } from '../api'

const useStyles = makeStyles((theme) => ({
  root: {
    textAlign: 'center',
    padding: theme.spacing(2)
  },
  breadcrumbsContainer: {
    marginBottom: theme.spacing(2)
  },
  spacing: {
    marginBottom: theme.spacing(2)
  },
  swaggerLink: {
    display: 'block',
    clear: 'both'
  }
}))

interface LayoutProps extends BreadcrumbsProps {
  devMode?: boolean
  children: React.ReactNode
}

export default function Layout (props: LayoutProps): JSX.Element {
  const classes = useStyles()

  const devBlock = props.devMode === true && (
    <div className={classes.spacing}>
    <div className={classes.swaggerLink}>
      <Link href={`/swagger?csrfToken=${String(getCSRFToken())}`} target='_blank'>Swagger UI</Link>
    </div>
    <div style={{ position: 'fixed', right: '25px', top: '25px', zIndex: 999 }}>
      <ResponsiveHelper />
    </div>
    </div>
  )

  return (
    <Grid container className={classes.root}>
      <Grid item sm={12} md={10} lg={9}>
        {devBlock}
        <div className={classes.breadcrumbsContainer}><Breadcrumbs {...props} /></div>
        <div className={classes.spacing}>{props.children}</div>
        <footer>
          <Typography>Copyright © 2022 The Regents of the University of Michigan</Typography>
        </footer>
      </Grid>
    </Grid>
  )
}
