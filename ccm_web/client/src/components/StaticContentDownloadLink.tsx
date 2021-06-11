import { Link } from '@material-ui/core'
import React from 'react'

interface StaticContentDownloadLinkProps {
  data: string
  fileName: string
  linkText: string
}

function StaticContentDownloadLink (props: StaticContentDownloadLinkProps): JSX.Element {
  return (
    <Link href={encodeURI('data:text/csv;charset=utf-8,' + props.data)} download={props.fileName}>{props.linkText}</Link>
  )
}

export default StaticContentDownloadLink
