import { useMediaQuery, useTheme } from '@material-ui/core'
import React from 'react'

function ResponsiveHelper (): JSX.Element {
  const theme = useTheme()
  const sm = useMediaQuery(theme.breakpoints.up('sm'))
  const md = useMediaQuery(theme.breakpoints.up('md'))
  const lg = useMediaQuery(theme.breakpoints.up('lg'))

  return (
    <div>
      <p>Size {lg ? 'lg' : md ? 'md' : sm ? 'sm' : 'xs'}</p>
    </div>
  )
}

export default ResponsiveHelper
