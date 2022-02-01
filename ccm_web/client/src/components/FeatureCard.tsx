import React from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Card, CardActionArea, CardContent, Grid, makeStyles, Typography } from '@material-ui/core'

import { FeatureUIProps } from '../models/FeatureUIData'

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: '#FAFAFA',
    height: 200
  },
  centered: {
    width: '100%'
  },
  title: {
    fontSize: 14
  },
  cardLink: {
    textDecoration: 'none'
  }
}))

function FeatureCard (props: FeatureUIProps): JSX.Element {
  const classes = useStyles()

  return (
    <RouterLink className={classes.cardLink} to={props.route} tabIndex={-1}>
      <Card variant='outlined'>
        <CardActionArea>
          <CardContent className={`${classes.root}`}>
            <Grid container>
              <Grid item xs={12}>
                <div className={classes.centered}>
                  {props.icon}
                </div>
                <div className={classes.centered}>
                  <Typography className={classes.title} color='textPrimary' gutterBottom>
                    {props.data.title}
                  </Typography>
                  <Typography variant='body2' component='p' color='textSecondary'>
                    {props.data.description}
                  </Typography>
                </div>
              </Grid>
            </Grid>
          </CardContent>
        </CardActionArea>
      </Card>
    </RouterLink>
  )
}

export default FeatureCard
