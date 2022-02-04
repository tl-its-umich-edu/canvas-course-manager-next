import React from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Breadcrumbs as MuiBreadcrumbs, Link, makeStyles, Typography } from '@material-ui/core'
import NavigateNextIcon from '@material-ui/icons/NavigateNext'

import { FeatureUIProps } from '../models/FeatureUIData'

const useStyles = makeStyles(() => ({
  breadcrumbs: {
    fontSize: '1.125rem'
  },
  breadcrumbContainer: {
    paddingLeft: 25,
    paddingTop: 25
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

interface BreadcrumbsProps {
  pathnames?: string[]
  features?: FeatureUIProps[]
}

function Breadcrumbs (props: BreadcrumbsProps): JSX.Element {
  const classes = useStyles()
  const { features, pathnames } = props
  return (
    <MuiBreadcrumbs
      className={classes.breadcrumbContainer}
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
    </MuiBreadcrumbs>
  )
}

export default Breadcrumbs
