import React from 'react'
import { makeStyles, Typography } from '@material-ui/core'

import StaticContentDownloadLink from './StaticContentDownloadLink'

const useStyles = makeStyles(() => ({
  uploadHeader: {
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
  const classes = useStyles()
  const { body, description, fileData, fileName } = props

  return (
    <div className={classes.uploadHeader}>
      <Typography variant='h6'component='h2'>Upload your CSV file</Typography>
      {description !== undefined && <Typography>{props.description}</Typography>}
      <br/>
      <Typography><strong>Requirement(s):</strong></Typography>
      {body}
      <StaticContentDownloadLink data={fileData} fileName={fileName} linkText='Download an example' />
    </div>
  )
}

export type { ExampleFileDownloadHeaderProps }
export default ExampleFileDownloadHeader
