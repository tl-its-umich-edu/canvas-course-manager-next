import React from 'react'
import { Grid, makeStyles } from '@material-ui/core'

import Breadcrumbs, { BreadcrumbsProps } from './Breadcrumbs'

const useStyles = makeStyles((theme) => ({
  root: {
    textAlign: 'center',
    padding: theme.spacing(2)
  },
  breadcrumbsContainer: {
    marginBottom: theme.spacing(2)
  }
}))

interface LayoutProps extends BreadcrumbsProps {
  children: React.ReactNode
}

export default function Layout (props: LayoutProps): JSX.Element {
  const classes = useStyles()
  return (
    <Grid container className={classes.root}>
      <Grid item sm={12} md={10} lg={9}>
        <div className={classes.breadcrumbsContainer}><Breadcrumbs {...props} /></div>
        {props.children}
      </Grid>
    </Grid>
  )
}
