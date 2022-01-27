import React from 'react'
import { Link } from '@material-ui/core'

interface CanvasSettingsLinkProps {
  url: string
  msg?: string
}

export default function CanvasSettingsLink (linkProps: CanvasSettingsLinkProps): JSX.Element {
  const url = linkProps.url
  const msg = linkProps.msg == null ? 'Canvas Settings page' : linkProps.msg
  return (
      <Link style={{ textDecoration: 'underline' }} href={url} target='_parent'>{msg}</Link>
  )
}
