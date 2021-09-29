import React from 'react'
import { Card, CardContent, CardActions, makeStyles } from '@material-ui/core'
import CheckCircle from '@material-ui/icons/CheckCircle'

interface SuccessCardProps {
  message: JSX.Element
  nextAction: JSX.Element
}

const useStyles = makeStyles((theme) => ({
  card: {
    textAlign: 'center'
  },
  cardFooter: {
    display: 'block',
    backgroundColor: '#F7F7F7',
    textAlign: 'center'
  },
  cardFooterText: {
    textAlign: 'center'
  },
  icon: {
    color: '#306430',
    width: 100,
    height: 100
  }
}))

export default function SuccessCard (props: SuccessCardProps): JSX.Element {
  const classes = useStyles()
  return (
    <Card className={classes.card} variant="outlined">
      <CardContent>
        <CheckCircle className={classes.icon} fontSize='large'/>
        {props.message}
      </CardContent>
      <CardActions className={classes.cardFooter}>{props.nextAction}</CardActions>
    </Card>
  )
}
