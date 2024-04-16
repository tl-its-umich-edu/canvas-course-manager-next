import React from 'react'
import { styled } from '@mui/material/styles'
import { Button, Paper, Typography } from '@mui/material'
import { CloudDone as CloudDoneIcon } from '@mui/icons-material'

import { DownloadData } from '../models/models.js'

const PREFIX = 'ConfirmDialog'

const classes = {
  padding: `${PREFIX}-padding`,
  dialog: `${PREFIX}-dialog`,
  dialogIcon: `${PREFIX}-dialogIcon`,
  dialogButton: `${PREFIX}-dialogButton`
}

const Root = styled('div')((
  {
    theme
  }
) => ({
  [`& .${classes.padding}`]: {
    padding: theme.spacing(1)
  },

  [`&.${classes.dialog}`]: {
    textAlign: 'center',
    margin: 'auto',
    marginTop: 30,
    marginBottom: 15
  },

  [`& .${classes.dialogIcon}`]: {
    color: theme.palette.info.main
  },

  [`& .${classes.dialogButton}`]: {
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
    <Root className={classes.dialog}>
      <Paper className={classes.padding} role='status'>
        <Typography>{props.title ?? defaultTitle}</Typography>
        {props.icon !== undefined ? props.icon : <CloudDoneIcon className={classes.dialogIcon} fontSize='large' />}
        <Typography gutterBottom>{props.message ?? defaultMessage}</Typography>
        <Button className={classes.dialogButton} variant='outlined' onClick={props.cancel} disabled={props.disabled}>
          Cancel
        </Button>
        {submitButton}
      </Paper>
    </Root>
  )
}
