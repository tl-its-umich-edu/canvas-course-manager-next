import React from 'react'
import { styled } from '@mui/material/styles'
import { Card, CardContent, CardActions } from '@mui/material'
import  { CheckCircle } from '@mui/icons-material'

const PREFIX = 'SuccessCard'

const classes = {
  card: `${PREFIX}-card`,
  cardFooter: `${PREFIX}-cardFooter`,
  cardFooterText: `${PREFIX}-cardFooterText`,
  icon: `${PREFIX}-icon`
}

const StyledCard = styled(Card)((
  {
    theme
  }
) => ({
  [`&.${classes.card}`]: {
    textAlign: 'center'
  },

  [`& .${classes.cardFooter}`]: {
    display: 'block',
    backgroundColor: '#F7F7F7',
    textAlign: 'center'
  },

  [`& .${classes.cardFooterText}`]: {
    textAlign: 'center'
  },

  [`& .${classes.icon}`]: {
    color: theme.palette.success.main,
    width: 100,
    height: 100
  }
}))

interface SuccessCardProps {
  message: JSX.Element
  nextAction?: JSX.Element
}

export default function SuccessCard (props: SuccessCardProps): JSX.Element {
  return (
    <StyledCard className={classes.card} variant='outlined'>
      <CardContent>
        <CheckCircle className={classes.icon} fontSize='large'/>
        {props.message}
      </CardContent>
      {
        props.nextAction !== undefined &&
          <CardActions className={classes.cardFooter}>{props.nextAction}</CardActions>
      }
    </StyledCard>
  )
}
