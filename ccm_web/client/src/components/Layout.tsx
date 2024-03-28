import React from 'react'
import { styled } from '@mui/material/styles'
import { Divider, Grid, Link, Paper, Typography } from '@mui/material'
import BuildIcon from '@mui/icons-material/Build'

import Breadcrumbs, { BreadcrumbsProps } from './Breadcrumbs'
import ResponsiveHelper from './ResponsiveHelper'
import { CsrfToken } from '../models/models'

const PREFIX = 'Layout'

const classes = {
  root: `${PREFIX}-root`,
  spacing: `${PREFIX}-spacing`,
  devModePaper: `${PREFIX}-devModePaper`,
  swaggerLink: `${PREFIX}-swaggerLink`
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
  }
}))

interface LayoutProps extends BreadcrumbsProps {
  devMode?: boolean
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
            <Link href={`/swagger?csrfToken=${String(props.csrfToken.token)}`} target='_blank'>Swagger UI</Link>
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
        <div className={classes.spacing}><Breadcrumbs {...props} /></div>
        <div className={classes.spacing}>{props.children}</div>
        <Divider className={classes.spacing} />
        <footer>
          <Typography>Copyright © 2022 The Regents of the University of Michigan</Typography>
        </footer>
      </Grid>
    </StyledGrid>
  )
}
