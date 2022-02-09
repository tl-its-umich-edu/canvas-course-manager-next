import React from 'react'
import { makeStyles } from '@material-ui/core'

const useStyles = makeStyles(() => ({
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0,0,0,0)',
    border: '0'
  }
}))

interface TableCaptionProps {
  text: string
}

export default function TableCaption (props: TableCaptionProps): JSX.Element {
  const classes = useStyles()
  return <caption className={classes.srOnly}>{props.text}</caption>
}
