import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Card from '@material-ui/core/Card'
// import CardActions from '@material-ui/core/CardActions'
import CardContent from '@material-ui/core/CardContent'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'

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
  }

}))

function FeatureCard (props: FeatureCardProps): JSX.Element {
  const classes = useStyles()

  return (
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
  )
}

interface FeatureCardProps {
  id: string
  title: string
  description: string
  icon: JSX.Element
  ordinalty: number
}

export { FeatureCard as default }
export type { FeatureCardProps }
