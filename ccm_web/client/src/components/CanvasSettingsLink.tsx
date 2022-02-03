import React from 'react'
import { Link } from '@material-ui/core'

interface CanvasSettingsLinkProps {
  url: string
  msg?: string
}

export default function CanvasSettingsLink (props: CanvasSettingsLinkProps): JSX.Element {
  const url = props.url
  const msg = props.msg == null ? 'Canvas Settings page' : props.msg
  return <Link href={url} target='_parent'>{msg}</Link>
}
