import React from 'react'
import { Button, Grid, makeStyles, Paper, Typography } from '@material-ui/core'
import ErrorIcon from '@material-ui/icons/Error'

const useStyles = makeStyles((theme) => ({
  dialog: {
    textAlign: 'center',
    maxWidth: '75%',
    margin: 'auto',
    marginTop: 30,
    marginBottom: 15,
    paddingLeft: 10,
    paddingRight: 10,
    width: '75%',
    '& ol': {
      margin: 'auto',
      width: '75%'
    },
    '& li': {
      textAlign: 'left'
    }
  },
  dialogIcon: {
    color: '#3F648E'
  }
}))

interface APIErrorAlertProps {
  message?: JSX.Element
  tryAgain: () => void
}

export default function APIErrorAlert (props: APIErrorAlertProps): JSX.Element {
  const classes = useStyles()
  const defaultMessage = <Typography>Something went wrong. Please try again later.</Typography>
  return (
    <Grid item xs={12} className={classes.dialog}>
      <Paper role='alert'>
        <ErrorIcon className={classes.dialogIcon} fontSize='large'/>
        {props.message !== undefined ? props.message : defaultMessage}
        <Button color='primary' component='span' onClick={props.tryAgain}>Try Again</Button>
      </Paper>
    </Grid>
  )
}
