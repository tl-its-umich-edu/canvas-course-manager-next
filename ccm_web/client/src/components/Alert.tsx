import React, { type JSX } from 'react'
import { styled } from '@mui/material/styles'
import { Grid, Paper, Typography } from '@mui/material'

const StyledGrid = styled(Grid)(() => ({
  margin: 'auto'

}))

const StyledCorePaper = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'severity'
})<{ severity?: 'warning' }>((
  {
    theme,
    severity
  }
) => ({
  textAlign: 'center',
  padding: theme.spacing(1),
  margin: 'auto',
  marginTop: 30,
  marginBottom: 15,
  '& ol': {
    margin: 'auto'
  },
  '& li': {
    textAlign: 'left',
    marginBottom: 10
  },
  ...(severity === 'warning' && {
    '& > .MuiSvgIcon-root': {
      color: theme.palette.warning.main
    }
  })
}))

interface AlertProps {
  children: React.ReactNode
  title: string
  icon: JSX.Element
  embedded?: boolean
  severity?: 'warning'
}

export default function Alert (props: AlertProps): JSX.Element {
  const { title, icon, embedded, severity, children } = props

  const core = (
    <StyledCorePaper role='alert' severity={severity}>
      <Typography gutterBottom>{title}</Typography>
      {icon}
      {children}
    </StyledCorePaper>
  )

  if (embedded === true) return core
  return (
    <StyledGrid size={{ xs: 12, sm: 9, md: 6 }}>
      {core}
    </StyledGrid>
  )
}
