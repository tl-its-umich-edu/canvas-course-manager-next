import React from 'react'
import { styled } from '@mui/material/styles'
import { Grid, Paper, Typography } from '@mui/material'

const PREFIX = 'Alert'

const classes = {
  padding: `${PREFIX}-padding`,
  standalone: `${PREFIX}-standalone`,
  dialog: `${PREFIX}-dialog`
}

const StyledGrid = styled(Grid)((
  {
    theme
  }
) => ({
  [`&.${classes.standalone}`]: {
    margin: 'auto'
  },
}))

const StyledCorePaper = styled(Paper)((
  {
    theme
  }
) => ({
  textAlign: 'center',
    margin: 'auto',
    marginTop: 30,
    marginBottom: 15,
    '& ol': {
      margin: 'auto'
    },
    '& li': {
      textAlign: 'left',
      marginBottom: 10
    }
  }));


interface AlertProps {
  children: React.ReactNode
  title: string
  icon: JSX.Element
  embedded?: boolean
}

export default function Alert (props: AlertProps): JSX.Element {
  const { title, icon, embedded, children } = props

  const core = (
    <StyledCorePaper role='alert'>
      <Typography gutterBottom>{title}</Typography>
      {icon}
      {children}
    </StyledCorePaper>
  )

  if (embedded === true) return core
  return (
    <StyledGrid item xs={12} sm={9} md={6} className={classes.standalone}>
      {core}
    </StyledGrid>
  )
}
