import React from 'react'
import { Button, makeStyles, Paper, Typography } from '@material-ui/core'
import CloudDoneIcon from '@material-ui/icons/CloudDone'

import { DownloadData } from '../models/models'

const useStyles = makeStyles((theme) => ({
  padding: {
    padding: theme.spacing(1)
  },
  dialog: {
    textAlign: 'center',
    margin: 'auto',
    marginTop: 30,
    marginBottom: 15
  },
  dialogIcon: {
    color: theme.palette.info.main
  },
  dialogButton: {
    margin: 5
  }
}))

interface ConfirmDialogProps {
  title?: string
  message?: string
  icon?: JSX.Element
  cancel: () => void
  submit: (() => void) | (() => Promise<void>)
  download?: DownloadData
  disabled?: boolean
}

export default function ConfirmDialog (props: ConfirmDialogProps): JSX.Element {
  const classes = useStyles()
  const defaultTitle = 'Review your CSV file'
  const defaultMessage = 'Your file is valid! If this looks correct, click "Submit" to proceed.'

  let downloadProps
  if (props.download !== undefined) {
    downloadProps = {
      component: 'a',
      href: props.download.data,
      download: props.download.fileName
    }
  }

  const submitButton = (
    <Button
      className={classes.dialogButton}
      variant='contained'
      color='primary'
      onClick={props.submit}
      disabled={props.disabled}
      {...downloadProps}
    >
      Submit
    </Button>
  )

  return (
    <div className={classes.dialog}>
      <Paper className={classes.padding} role='status'>
        <Typography>{props.title ?? defaultTitle}</Typography>
        {props.icon !== undefined ? props.icon : <CloudDoneIcon className={classes.dialogIcon} fontSize='large' />}
        <Typography gutterBottom>{props.message ?? defaultMessage}</Typography>
        <Button className={classes.dialogButton} variant='outlined' onClick={props.cancel} disabled={props.disabled}>
          Cancel
        </Button>
        {submitButton}
      </Paper>
    </div>
  )
}
