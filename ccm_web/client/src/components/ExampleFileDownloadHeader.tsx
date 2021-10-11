import React from 'react'
import { makeStyles, Typography } from '@material-ui/core'
import StaticContentDownloadLink from './StaticContentDownloadLink'

interface ExampleFileDownloadHeaderProps {
  bodyText: string
  fileData: string
  fileName: string
  linkText: string
  titleText: string
}

const useStyles = makeStyles((theme) => ({
  uploadHeader: {
    paddingTop: 15
  }
}))

function ExampleFileDownloadHeader (props: ExampleFileDownloadHeaderProps): JSX.Element {
  const classes = useStyles()

  const renderUploadHeader = (): JSX.Element => {
    const fileData = props.fileData
    return <div className={classes.uploadHeader}>
      <Typography variant='h6'>{props.titleText}</Typography>
      <br/>
      <Typography><strong>Requirement(s):</strong> {props.bodyText}</Typography>
      <StaticContentDownloadLink data={fileData} fileName={props.fileName} linkText={props.linkText}/>
    </div>
  }

  return (renderUploadHeader())
}

export type { ExampleFileDownloadHeaderProps }
export default ExampleFileDownloadHeader
