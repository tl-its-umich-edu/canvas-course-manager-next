import React from 'react'
import { styled } from '@mui/material/styles'
import { Link, Typography } from '@mui/material'

import { prepDownloadDataString } from '../utils/fileUtils'

const PREFIX = 'ExampleFileDownloadHeader'

const classes = {
  uploadHeader: `${PREFIX}-uploadHeader`
}

const Root = styled('div')(() => ({
  [`&.${classes.uploadHeader}`]: {
    marginTop: 15,
    marginBottom: 15
  }
}))

interface ExampleFileDownloadHeaderProps {
  body: JSX.Element
  description?: string
  fileData: string
  fileName: string
}

function ExampleFileDownloadHeader (props: ExampleFileDownloadHeaderProps): JSX.Element {
  const { body, description, fileData, fileName } = props

  return (
    <Root className={classes.uploadHeader}>
      <Typography variant='h6' component='h2'>Upload your CSV file</Typography>
      {description !== undefined && <Typography>{props.description}</Typography>}
      <br/>
      <Typography><strong>Requirement(s):</strong></Typography>
      {body}
      <Link href={prepDownloadDataString(fileData)} download={fileName}>
        Download an example
      </Link>
    </Root>
  )
}

export type { ExampleFileDownloadHeaderProps }
export default ExampleFileDownloadHeader
