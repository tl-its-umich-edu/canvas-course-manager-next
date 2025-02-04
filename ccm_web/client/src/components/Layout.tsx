import React from 'react'
import { styled } from '@mui/material/styles'
import { Divider, Grid, Link, Paper, Typography } from '@mui/material'
import { Build as BuildIcon } from '@mui/icons-material'

import Breadcrumbs, { BreadcrumbsProps } from './Breadcrumbs.js'
import ResponsiveHelper from './ResponsiveHelper.js'
import { CsrfToken } from '../models/models.js'

const PREFIX = 'Layout'

const classes = {
  root: `${PREFIX}-root`,
  spacing: `${PREFIX}-spacing`,
  devModePaper: `${PREFIX}-devModePaper`,
  swaggerLink: `${PREFIX}-swaggerLink`,
  breadcrumbsContainer: `${PREFIX}-breadcrumbsContainer`
}

const StyledGrid = styled(Grid)((
  {
    theme
  }
) => ({
  [`&.${classes.root}`]: {
    textAlign: 'center',
    padding: theme.spacing(2)
  },

  [`& .${classes.spacing}`]: {
    marginBottom: theme.spacing(2)
  },

  [`& .${classes.devModePaper}`]: {
    padding: theme.spacing(1)
  },

  [`& .${classes.swaggerLink}`]: {
    display: 'block',
    clear: 'both'
  },

  [`& .${classes.breadcrumbsContainer}`]: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
}))

interface LayoutProps extends BreadcrumbsProps {
  devMode?: boolean
  isAdmin?: boolean
  children: React.ReactNode
  csrfToken?: CsrfToken
}

export default function Layout (props: LayoutProps): JSX.Element {
  const devBlock = props.devMode === true && props.csrfToken ? 
    (
      <>
      <div className={`${classes.swaggerLink} ${classes.spacing}`}>
        <Paper variant='outlined' className={classes.devModePaper}>
          <Typography component='span' variant='subtitle1'>
            <BuildIcon fontSize='small' /> Development Mode:&nbsp;
          </Typography>
          <Typography component='span'>
            <Link href='/api/schema/swagger-ui' target='_blank'>Swagger UI</Link>
          </Typography>
        </Paper>
      </div>
      <div style={{ position: 'fixed', right: '25px', top: '25px', zIndex: 999 }}>
        <ResponsiveHelper />
      </div>
      </>
    ) : 
    null

  return (
    <StyledGrid container className={classes.root}>
      <Grid item sm={12} md={10} lg={9}>
        {devBlock}
        <div className={`${classes.spacing} ${classes.breadcrumbsContainer}`}>
          <Breadcrumbs {...props} />
          {props.isAdmin && <Link href="/admin/">Admin</Link>}
        </div>
        <div className={classes.spacing}>{props.children}</div>
        <Divider className={classes.spacing} />
        <footer>
          <Typography>{`Copyright © ${new Date().getFullYear()} The Regents of the University of Michigan`}</Typography>
        </footer>
      </Grid>
    </StyledGrid>
  )
}
