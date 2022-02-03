import React from 'react'
import { makeStyles, Typography } from '@material-ui/core'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: 25,
    textAlign: 'left'
  },
  spacing: {
    marginBottom: theme.spacing(2)
  }
}))

export default function NotFound (): JSX.Element {
  const classes = useStyles()
  return (
    <div className={classes.root}>
      <Typography variant='h5' component='h1' className={classes.spacing}>Not Found</Typography>
      <Typography gutterBottom>There is no content at this route.</Typography>
      <Typography>
        You can use the &quot;Canvas Course Manager&quot; link above to return to the home page.
      </Typography>
    </div>
  )
}
