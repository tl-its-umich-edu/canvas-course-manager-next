import React from 'react'
import { Divider, Grid, Link, makeStyles, Paper, Typography } from '@material-ui/core'
import BuildIcon from '@material-ui/icons/Build'

import Breadcrumbs, { BreadcrumbsProps } from './Breadcrumbs'
import ResponsiveHelper from './ResponsiveHelper'
import { getCSRFToken } from '../api'

const useStyles = makeStyles((theme) => ({
  root: {
    textAlign: 'center',
    padding: theme.spacing(2)
  },
  spacing: {
    marginBottom: theme.spacing(2)
  },
  devModePaper: {
    padding: theme.spacing(1)
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
    <>
    <div className={`${classes.swaggerLink} ${classes.spacing}`}>
      <Paper variant='outlined' className={classes.devModePaper}>
        <Typography component='span' variant='subtitle1'>
          <BuildIcon fontSize='small' /> Development Mode:&nbsp;
        </Typography>
        <Typography component='span'>
          <Link href={`/swagger?csrfToken=${String(getCSRFToken())}`} target='_blank'>Swagger UI</Link>
        </Typography>
      </Paper>
    </div>
    <div style={{ position: 'fixed', right: '25px', top: '25px', zIndex: 999 }}>
      <ResponsiveHelper />
    </div>
    </>
  )

  return (
    <Grid container className={classes.root}>
      <Grid item sm={12} md={10} lg={9}>
        {devBlock}
        <div className={classes.spacing}><Breadcrumbs {...props} /></div>
        <div className={classes.spacing}>{props.children}</div>
        <Divider className={classes.spacing} />
        <footer>
          <Typography>Copyright © 2022 The Regents of the University of Michigan</Typography>
        </footer>
      </Grid>
    </Grid>
  )
}
