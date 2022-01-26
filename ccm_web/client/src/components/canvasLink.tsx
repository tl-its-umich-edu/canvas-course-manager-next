import React from 'react'
import { Link } from '@material-ui/core'

interface CanvasLinkProps {
  url: string
  msg?: string
}

export default function CanvasLink (linkProps: CanvasLinkProps): JSX.Element {
  const url = linkProps.url
  const msg = linkProps.msg == null ? 'Canvas Settings page' : linkProps.msg
  return (
      <Link style={{ textDecoration: 'underline' }} href={url} target='_parent'>{msg}</Link>
  )
}
