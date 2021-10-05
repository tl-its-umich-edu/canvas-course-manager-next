import React from 'react'
import { makeStyles, Typography } from '@material-ui/core'

const useStyles = makeStyles(() => ({
  fileNameContainer: {
    marginBottom: 15,
    paddingLeft: 10,
    paddingRight: 10,
    textAlign: 'left'
  },
  fileName: {
    color: '#3F648E',
    fontFamily: 'monospace'
  }
}))

interface CSVFileNameProps {
  file: File
}

export default function CSVFileName (props: CSVFileNameProps): JSX.Element {
  const classes = useStyles()
  return (
    <h5 className={classes.fileNameContainer}>
      <Typography component='span'>File: </Typography>
      <Typography component='span' className={classes.fileName}>{props.file.name}</Typography>
    </h5>
  )
}
