import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Card, CardContent, Grid, Typography } from '@material-ui/core'
import { Link } from 'react-router-dom'
import { FeatureCardProps } from '../models/FeatureCardData'

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

function FeatureCard (props: FeatureCardProps): JSX.Element {
  const classes = useStyles()

  return (
    <Link className={classes.cardLink} to={props.route} >
      <Card className={`${classes.root}`} variant="outlined" tabIndex={props.data.ordinality}>
        <CardContent>
          <Grid container>
            <Grid item xs={12}>
              <div className={classes.centered}>
                {props.icon}
              </div>
              <div className={classes.centered}>
                <Typography className={classes.title} color="textPrimary" gutterBottom>
                  {props.data.title}
                </Typography>
                <Typography variant="body2" component="p" color="textSecondary">
                  {props.data.description}
                </Typography>
              </div>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Link>
  )
}

export default FeatureCard
