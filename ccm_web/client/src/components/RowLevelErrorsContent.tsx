import React from 'react'
import { Button, Box, Grid, makeStyles, Paper, Typography } from '@material-ui/core'
import { Error as ErrorIcon, Warning } from '@material-ui/icons'

const useStyles = makeStyles(() => ({
  dialog: {
    textAlign: 'center',
    marginBottom: 15,
    paddingLeft: 10,
    paddingRight: 10
  },
  table: {
    paddingLeft: 10,
    paddingRight: 10
  },
  errorIcon: {
    color: '#3F648E'
  },
  warningIcon: {
    color: '#E2CF2A'
  }
}))

interface RowLevelErrorsContentProps {
  table: JSX.Element
  title: string
  errorType: 'error' | 'warning'
  resetUpload: () => void
  message?: JSX.Element
}

function RowLevelErrorsContent (props: RowLevelErrorsContentProps): JSX.Element {
  const classes = useStyles()
  const defaultMessage = (
    <Typography>
      Create a new file with corrected versions of these lines and try again.
    </Typography>
  )

  return (
    <Grid container justify='flex-start'>
      <Box clone order={{ xs: 2, sm: 1 }}>
        <Grid item xs={12} sm={9} className={classes.table}>{props.table}</Grid>
      </Box>
      <Box clone order={{ xs: 1, sm: 2 }}>
        <Grid item xs={12} sm={3} className={classes.dialog}>
          <Paper role='alert'>
            <Typography>{props.title}</Typography>
            {
              props.errorType === 'error'
                ? <ErrorIcon className={classes.errorIcon} fontSize='large'/>
                : <Warning className={classes.warningIcon} fontSize='large'/>
            }
            {props.message !== undefined ? props.message : defaultMessage}
            <Button color='primary' component='span' onClick={props.resetUpload}>Upload again</Button>
          </Paper>
        </Grid>
      </Box>
    </Grid>
  )
}

export default RowLevelErrorsContent
