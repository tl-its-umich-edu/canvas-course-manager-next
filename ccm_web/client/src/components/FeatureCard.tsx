import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Card, CardContent, Grid, Typography } from '@material-ui/core'
import { Link } from 'react-router-dom'

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
      <Card className={`${classes.root}`} variant="outlined" tabIndex={props.ordinalty}>
        <CardContent>
          <Grid container>
            <Grid item xs={12}>
              <div className={classes.centered}>
                {props.icon}
              </div>
              <div className={classes.centered}>
                <Typography className={classes.title} color="textPrimary" gutterBottom>
                  {props.title}
                </Typography>
                <Typography variant="body2" component="p" color="textSecondary" >
                  {props.description}
                </Typography>
              </div>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Link>
  )
}

interface FeatureCardProps {
  id: string
  title: string
  description: string
  icon: JSX.Element
  ordinalty: number
  route: string
}

export { FeatureCard as default }
export type { FeatureCardProps }
