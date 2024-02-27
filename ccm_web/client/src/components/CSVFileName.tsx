import React from 'react'
import { styled } from '@mui/material/styles'
import { Typography } from '@mui/material'

const PREFIX = 'CSVFileName'

const classes = {
  fileNameContainer: `${PREFIX}-fileNameContainer`,
  fileName: `${PREFIX}-fileName`
}

const Root = styled('h5')((
  {
    theme
  }
) => ({
  [`&.${classes.fileNameContainer}`]: {
    marginBottom: 15,
    paddingLeft: 10,
    paddingRight: 10,
    textAlign: 'left'
  },

  [`& .${classes.fileName}`]: {
    color: theme.palette.info.main,
    fontFamily: 'monospace'
  }
}))

interface CSVFileNameProps {
  file: File
}

export default function CSVFileName (props: CSVFileNameProps): JSX.Element {
  return (
    <Root className={classes.fileNameContainer}>
      <Typography component='span'>File: </Typography>
      <Typography component='span' className={classes.fileName}>{props.file.name}</Typography>
    </Root>
  )
}
