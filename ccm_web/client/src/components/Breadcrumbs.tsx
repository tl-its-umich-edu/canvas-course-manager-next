import React from 'react'
import { styled } from '@mui/material/styles'
import { Link as RouterLink } from 'react-router-dom'
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography } from '@mui/material'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'

import { FeatureUIProps } from '../models/FeatureUIData'

const PREFIX = 'Breadcrumbs'

const classes = {
  breadcrumbs: `${PREFIX}-breadcrumbs`
}

const StyledMuiBreadcrumbs = styled(MuiBreadcrumbs)(() => ({
  [`& .${classes.breadcrumbs}`]: {
    fontSize: '1.125rem'
  }
}))

interface HomeBreadcrumbProps {
  isLink: boolean
  className: string
}

interface TitleTypographyProps {
  to?: string
}

const HomeBreadcrumb = (props: HomeBreadcrumbProps): JSX.Element => {
  const typography = (
    <Typography className={props.className} color='textPrimary'>
      Canvas Course Manager
    </Typography>
  )
  return props.isLink
    ? (<Link component={RouterLink} to='/'>{typography}</Link>)
    : (typography)
}

export interface BreadcrumbsProps {
  pathnames?: string[]
  features?: FeatureUIProps[]
}

function Breadcrumbs (props: BreadcrumbsProps): JSX.Element {
  const { features, pathnames } = props
  return (
    <StyledMuiBreadcrumbs
      aria-label='breadcrumb'
      separator={<NavigateNextIcon fontSize='small' />}
    >
      <HomeBreadcrumb isLink={pathnames !== undefined && pathnames.length > 0} className={classes.breadcrumbs} />
        {
          (pathnames !== undefined && features !== undefined) && (
            pathnames.map((value, index) => {
              const last = index === pathnames.length - 1
              const to = `/${pathnames.slice(0, index + 1).join('/')}`
              const matches = features.filter(f => f.route.substring(1) === value)
              if (matches.length === 0) return undefined
              const feature = matches[0]
              const titleTypographyProps: TitleTypographyProps = last ? { to: to } : {}
              return (
                <Typography className={classes.breadcrumbs} color='textPrimary' key={to} {...titleTypographyProps}>
                  {feature.data.title}
                </Typography>
              )
            })
          )
        }
    </StyledMuiBreadcrumbs>
  )
}

export default Breadcrumbs
