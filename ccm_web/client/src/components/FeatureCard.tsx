import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Card from '@material-ui/core/Card'
// import CardActions from '@material-ui/core/CardActions'
import CardContent from '@material-ui/core/CardContent'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: '#FAFAFA'
  },
  centered: {
    width: '100%'
  },
  title: {
    fontSize: 14
  },
  pos: {
    // marginBottom: 12
  },
  tall: {
    height: '400px'
  },
  short: {
    height: '188px',
    padding: '0px'
  }
}))

function FeatureCard (props: FeatureCardProps): JSX.Element {
  const classes = useStyles()

  function sizeClass (size: string): string {
    if (size === 'tall') {
      return classes.tall
    } else {
      return classes.short
    }
  }

  return (
    <Card className={`${classes.root} ${sizeClass(props.size)}`} variant="outlined">
        <CardContent>
            <Grid container xs={12}>
                <div className={classes.centered}>
                    {props.icon}
                    {/* {React.cloneElement(props.icon, { fontSize: 'large' })} */}
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
        </CardContent>
    </Card>
  )
}

interface FeatureCardProps {
  title: string
  description: string
  icon: JSX.Element
  size: 'tall' | 'short'
}

export { FeatureCard as default }
export type { FeatureCardProps }
