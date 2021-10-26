import React from 'react'
import { Button, Link, makeStyles, Paper, Typography } from '@material-ui/core'
import CloudDoneIcon from '@material-ui/icons/CloudDone'

import { DownloadData } from '../models/models'

const useStyles = makeStyles((theme) => ({
  padding: {
    padding: theme.spacing(1)
  },
  dialog: {
    textAlign: 'center',
    marginBottom: 15
  },
  dialogIcon: {
    color: '#3F648E'
  },
  dialogButton: {
    margin: 5
  }
}))

interface ConfirmDialogProps {
  title?: string
  message?: string
  cancel: () => void
  submit: (() => void) | (() => Promise<void>)
  download?: DownloadData
}

export default function ConfirmDialog (props: ConfirmDialogProps): JSX.Element {
  const classes = useStyles()
  const defaultTitle = 'Review Your CSV File'
  const defaultMessage = 'Your file is valid! If this looks correct, click "Submit" to proceed.'

  const submitButton = (
    <Button className={classes.dialogButton} variant='contained' color='primary' onClick={props.submit}>Submit</Button>
  )

  return (
    <div className={classes.dialog}>
      <Paper className={classes.padding} role='status'>
        <Typography>{props.title ?? defaultTitle}</Typography>
        <CloudDoneIcon className={classes.dialogIcon} fontSize='large' />
        <Typography>{props.message ?? defaultMessage}</Typography>
        <Button className={classes.dialogButton} variant='outlined' onClick={props.cancel}>Cancel</Button>
        {
          props.download !== undefined
            ? <Link href={props.download.data} download={props.download.fileName}>{submitButton}</Link>
            : submitButton
        }
      </Paper>
    </div>
  )
}
